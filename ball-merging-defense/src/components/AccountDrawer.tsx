// Панель «Аккаунт» (открывается из меню, значок «три полоски»).
// Гость: создать аккаунт (логин и пароль) или войти, либо продолжить как гость.
// Вошедший: логин, ID профиля и выход. Гостевой прогресс на устройстве не теряется.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Copy, KeyRound, LogIn, LogOut, UserPlus, X } from 'lucide-react';
import { PASSWORD_MIN, errorMessage, validateCredentials } from '../firebase';

export interface AccountView {
  status: 'guest' | 'checking' | 'in';
  login: string;
  uid: string;
}

type Mode = 'create' | 'login';

export function AccountDrawer({
  account,
  notice,
  onClose,
  onCreate,
  onSignIn,
  onLogout,
}: {
  account: AccountView;
  notice: string | null;
  onClose: () => void;
  onCreate: (login: string, password: string) => Promise<void>;
  onSignIn: (login: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        role="dialog"
        aria-label="Аккаунт"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[min(92vw,360px)] flex-col border-l border-white/10 bg-slate-900/95 shadow-2xl"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="font-display text-lg font-bold text-slate-100">Аккаунт</div>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {account.status === 'in' ? (
            <SignedIn account={account} onLogout={onLogout} onClose={onClose} />
          ) : (
            <Guest
              notice={notice}
              checking={account.status === 'checking'}
              onClose={onClose}
              onCreate={onCreate}
              onSignIn={onSignIn}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

// Вход выключен или ещё не включён в Firebase — гость всё равно может играть
function Guest({
  notice,
  checking,
  onClose,
  onCreate,
  onSignIn,
}: {
  notice: string | null;
  checking: boolean; // аккаунт сейчас проверяется в облаке (после входа)
  onClose: () => void;
  onCreate: (login: string, password: string) => Promise<void>;
  onSignIn: (login: string, password: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>('create');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const cleanLogin = login.trim().toLowerCase();
    const bad = validateCredentials(cleanLogin, password);
    if (bad) return setError(bad);
    setError(null);
    setBusy(true);
    try {
      if (mode === 'create') await onCreate(cleanLogin, password);
      else await onSignIn(cleanLogin, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-[16px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-[13px] leading-snug text-slate-300">
        <div className="font-bold text-slate-100">Вы играете как гость</div>
        Прогресс сохраняется на этом устройстве. Создайте аккаунт, чтобы играть с другого устройства и не
        потерять прогресс. Прогресс гостя переносится в новый аккаунт.
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-slate-950/70 p-1">
        {(['create', 'login'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold transition ${
              mode === m ? 'bg-white/[0.12] text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 'create' ? <UserPlus size={15} /> : <LogIn size={15} />}
            {m === 'create' ? 'Создать' : 'Войти'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block px-1 text-[12px] font-semibold text-slate-400">Логин</span>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            spellCheck={false}
            placeholder="например, orbit_pilot"
            className={inputCls}
            maxLength={20}
          />
        </label>
        <label className="block">
          <span className="mb-1 block px-1 text-[12px] font-semibold text-slate-400">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
            placeholder={`не меньше ${PASSWORD_MIN} символов`}
            className={inputCls}
          />
        </label>
        <p className="px-1 text-[11px] leading-snug text-slate-500">
          Логин: 3–20 символов, латинские буквы, цифры и «_». Почта не нужна.
        </p>

        {(error || notice) && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold leading-snug text-rose-200">
            {error ?? notice}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || checking}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-4 text-[15px] font-extrabold text-slate-950 shadow-lg shadow-cyan-500/30 transition enabled:active:scale-[0.98] disabled:opacity-60"
        >
          <KeyRound size={17} />
          {busy || checking ? 'Подождите…' : mode === 'create' ? 'Создать аккаунт' : 'Войти'}
        </button>
      </form>

      <button
        onClick={onClose}
        className="flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-[14px] font-bold text-slate-200 transition active:scale-[0.98]"
      >
        Продолжить как гость
      </button>
    </div>
  );
}

// Вошедший игрок: профиль и выход. Гостевая мета на устройстве не меняется.
function SignedIn({
  account,
  onLogout,
  onClose,
}: {
  account: AccountView;
  onLogout: () => Promise<void>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.uid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // буфер обмена недоступен (например, в file://) — ID можно выделить вручную
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] p-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">Аккаунт</div>
        <div className="font-display mt-1 truncate text-xl font-bold text-slate-100">{account.login}</div>
        <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">ID профиля</div>
        <div className="mt-1 flex items-start gap-2">
          <code className="min-w-0 flex-1 select-all break-all rounded-lg bg-slate-950/70 px-2 py-1.5 font-mono text-[12px] text-slate-200">
            {account.uid}
          </code>
          <button
            onClick={copy}
            aria-label="Скопировать ID профиля"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition active:scale-95"
          >
            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-snug text-slate-400">
          Прогресс сохраняется в облаке. Войдите с этим логином и паролем на другом устройстве.
        </p>
      </div>

      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await onLogout();
          onClose();
        }}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 text-[15px] font-bold text-slate-100 transition enabled:active:scale-[0.98] disabled:opacity-60"
      >
        <LogOut size={17} />
        Выйти из аккаунта
      </button>
      <p className="px-1 text-[12px] leading-snug text-slate-500">
        После выхода вы снова играете как гость, с прогрессом гостя на этом устройстве.
      </p>
    </div>
  );
}
