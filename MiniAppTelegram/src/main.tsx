import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadPublicRuntimeConfig } from "@/config/loadRuntimeConfig";
import { initGa4, trackMiniAppLaunch } from "@/analytics/ga4";
import { initTelegramWebApp } from "@/lib/telegramWebApp";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

function postToExpo(message: string) {
  try {
    window.ReactNativeWebView?.postMessage(message);
  } catch {
    /* ignore */
  }
}

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    postToExpo(
      `ROOT_ERROR:${error.message}\n${info.componentStack?.slice(0, 500) ?? ""}`,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            color: "#b91c1c",
            fontSize: 14,
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Errore nell’app</h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "#444",
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const el = document.getElementById("root");
if (!el) {
  throw new Error("Missing #root");
}

void loadPublicRuntimeConfig().then(() => {
  initTelegramWebApp();
  initGa4();
  trackMiniAppLaunch();
  const root = createRoot(el);
  root.render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>,
  );
  queueMicrotask(() => postToExpo("LMB_APP_READY"));
});
