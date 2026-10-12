// Экран входа: логин и пароль (без почты). Регистрация — тот же экран, другой режим.
// Успешный вход сообщает App через onPlayerChanged: App загружает облачную мету и открывает меню.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { PASSWORD_MIN, authErrorText, registerPlayer, signInPlayer, validateCredentials } from '../firebase';

type Mode = 'login' | 'register';

export function LoginScreen({ notice }: { notice: string | null }) {
  const [mode, setMode] = useState<Mode>('login');
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
      if (mode === 'register') await registerPlayer(cleanLogin, password);
      else await signInPlayer(cleanLogin, password);
      // дальше App получит пользователя из onPlayerChanged и откроет меню
    } catch (err) {
      setBusy(false);
      setError(authErrorText(err));
    }
  };

  const inputCls =
    'w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-[16px] text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60';

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[#0b0e18] p-5 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#3b2a7a_0%,#1a1446_42%,#0b0e18_78%)]" />
      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <div className="font-display text-3xl font-black tracking-wide text-white">ОРБИТАЛЬ</div>
          <div className="mt-1 text-[13px] text-slate-400">Войдите, чтобы прогресс сохранялся в облаке</div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-slate-950/70 p-1">
          {(['login', 'register'] as Mode[]).map((m) => (
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
              {m === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
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
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              placeholder={`не меньше ${PASSWORD_MIN} символов`}
              className={inputCls}
            />
          </label>
          <p className="px-1 text-[11px] leading-snug text-slate-500">
            Логин: 3–20 символов, латинские буквы, цифры и «_». Почта не нужна.
          </p>

          {(error || notice) && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-[13px] font-semibold text-rose-200">
              {error ?? notice}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 px-4 text-[16px] font-extrabold text-slate-950 shadow-lg shadow-cyan-500/30 transition enabled:active:scale-[0.98] disabled:opacity-60"
          >
            <KeyRound size={18} />
            {busy ? 'Подождите…' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
