import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Перехватывает ошибки отрисовки React-дерева.
 *
 * Без неё одна необработанная ошибка размонтирует всё приложение, и пользователь
 * снова увидит пустую страницу без объяснений. Здесь он видит текст ошибки и
 * кнопку перезагрузки, а подробности уходят в консоль браузера.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Неоновая Осада] ошибка отрисовки:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-void px-6 text-center">
        <h1 className="font-display text-2xl font-black tracking-wide text-rose-300">Игра не смогла отрисоваться</h1>
        <p className="max-w-lg text-sm text-white/60">
          Попробуйте перезагрузить страницу. Если ошибка повторяется, откройте консоль браузера (F12) и
          посмотрите подробности.
        </p>
        <pre className="max-w-xl overflow-auto rounded-lg bg-black/40 p-3 text-left text-xs text-rose-200/80">
          {error.message || String(error)}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
        >
          Перезагрузить
        </button>
      </div>
    );
  }
}
