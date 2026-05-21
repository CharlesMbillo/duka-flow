import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installSyncTriggers } from "@/lib/sync";

createRoot(document.getElementById("root")!).render(<App />);

// Offline-first: register service worker (skip in iframe/preview contexts)
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com") ||
    window.location.hostname.includes("lovable.app"));

if (isInIframe || isPreviewHost) {
  navigator.serviceWorker?.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
} else {
  import("virtual:pwa-register").then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        import("sonner").then(({ toast }) => {
          toast("Update available", {
            description: "A new version of KwaPOS is ready.",
            action: { label: "Reload", onClick: () => updateSW(true) },
            duration: 10000,
          });
        });
      },
      onOfflineReady() {
        import("sonner").then(({ toast }) => {
          toast.success("Ready to work offline");
        });
      },
    });
  });
}

installSyncTriggers();
