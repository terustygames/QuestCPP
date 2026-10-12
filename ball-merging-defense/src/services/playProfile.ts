// Облачное сохранение меты: Firestore, документ players/{uid}.
// Правила доступа — firestore.rules (игрок читает и пишет только свой документ).
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { parseMeta, type MetaState } from '../game/meta';

function profileRef() {
  const user = auth.currentUser;
  if (!user) throw new Error('Игрок не вошёл в аккаунт');
  return doc(db, 'players', user.uid);
}

// Меты в облаке нет (новый аккаунт) — возвращаем null, а не выдумываем данные.
export async function loadCloudMeta(): Promise<MetaState | null> {
  const snap = await getDoc(profileRef());
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.meta ? parseMeta(data.meta) : null;
}

export async function saveCloudMeta(meta: MetaState, login: string): Promise<void> {
  await setDoc(
    profileRef(),
    { meta, login, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// Первое создание документа: меты ещё нет, сохраняем стартовую
export async function createCloudProfile(meta: MetaState, login: string): Promise<void> {
  await setDoc(profileRef(), { meta, login, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

// Сохранение с задержкой: частые изменения (бой, покупки) уходят одним запросом.
let pending: { meta: MetaState; login: string } | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function scheduleCloudSave(meta: MetaState, login: string, delayMs = 800) {
  pending = { meta, login };
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void flushCloudSave(), delayMs);
}

export async function flushCloudSave(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const p = pending;
  pending = null;
  if (!p || !auth.currentUser) return;
  try {
    await saveCloudMeta(p.meta, p.login);
  } catch {
    // сеть недоступна: локальная копия уже сохранена, попробуем при следующем изменении
    pending = p;
  }
}
