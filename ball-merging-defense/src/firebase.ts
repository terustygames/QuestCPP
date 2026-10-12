// Firebase: вход игрока по логину и паролю, без почты.
// Firebase Email/Password требует формат адреса, поэтому логин превращается
// в служебный адрес login@orbital.app. Настоящей почты нет и не нужна:
// адрес существует только внутри Firebase Auth.
// Облачное сохранение — Firestore, документ players/{uid} (см. services/playProfile.ts).
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyA5uh7T_pimoWZR0960cuMgmk10J6jaCHo',
  authDomain: 'random-balls.firebaseapp.com',
  projectId: 'random-balls',
  databaseURL: 'https://random-balls-default-rtdb.europe-west1.firebasedatabase.app',
  storageBucket: 'random-balls.firebasestorage.app',
  messagingSenderId: '978166781680',
  appId: '1:978166781680:web:2e693f12f7e8755d01d435',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// Realtime Database — комнаты кооператива (см. services/rooms.ts)
export const rtdb = getDatabase(app);

const ACCOUNT_DOMAIN = 'orbital.app';
export const LOGIN_RE = /^[a-z0-9_]{3,20}$/;
export const PASSWORD_MIN = 6;

// Логин → служебный адрес для Firebase Auth
export function loginToEmail(login: string): string {
  return `${login.trim().toLowerCase()}@${ACCOUNT_DOMAIN}`;
}

// Проверка логина и пароля до отправки в Firebase. null — всё в порядке.
export function validateCredentials(login: string, password: string): string | null {
  if (!LOGIN_RE.test(login.trim().toLowerCase())) {
    return 'Логин: 3–20 символов, латинские буквы, цифры и «_»';
  }
  if (password.length < PASSWORD_MIN) return `Пароль: не меньше ${PASSWORD_MIN} символов`;
  return null;
}

// Текст ошибки Firebase по-русски
export function authErrorText(e: unknown): string {
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Неверный логин или пароль';
    case 'auth/email-already-in-use':
      return 'Такой логин уже занят';
    case 'auth/weak-password':
      return `Пароль слабый: не меньше ${PASSWORD_MIN} символов`;
    case 'auth/invalid-email':
      return 'Логин не подходит: используйте латиницу, цифры и «_»';
    case 'auth/too-many-requests':
      return 'Слишком много попыток. Подождите немного';
    case 'auth/network-request-failed':
      return 'Нет связи с сервером. Проверьте интернет';
    case 'auth/operation-not-allowed':
      return 'Вход по логину ещё не включён в Firebase: нужно включить Email/Password (Authentication → Sign-in method). Пока можно играть как гость';
    default:
      return 'Не удалось войти. Попробуйте ещё раз';
  }
}

// Любая ошибка (Auth, Firestore, сеть) — понятный текст для игрока
export function errorMessage(e: unknown): string {
  const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
  if (code.startsWith('auth/')) return authErrorText(e);
  if (code) return `Облачное сохранение недоступно (${code}). Играть можно как гость`;
  if (e instanceof Error && e.message) return e.message;
  return 'Что-то пошло не так. Попробуйте ещё раз';
}

export async function registerPlayer(login: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, loginToEmail(login), password);
  return cred.user;
}

export async function signInPlayer(login: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, loginToEmail(login), password);
  return cred.user;
}

export function signOutPlayer(): Promise<void> {
  return signOut(auth);
}

// Откат: удалить только что созданный аккаунт (если профиль в облаке не записался)
export async function deleteCurrentPlayer(): Promise<void> {
  if (auth.currentUser) await deleteUser(auth.currentUser);
}

// Логин игрока из служебного адреса (для показа в меню)
export function loginOf(user: User | null): string {
  if (!user?.email) return '';
  return user.email.split('@')[0] ?? '';
}

export function onPlayerChanged(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}
