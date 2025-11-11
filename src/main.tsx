import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import App from "./App.tsx";
import "./index.css";
import { initializeServiceWorker } from "./lib/performance/service-worker";
import { AppProviders } from "./app/AppProviders";

// Initialize service worker for caching
initializeServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SubscriptionProvider>
      <AppProviders>
        <App />
      </AppProviders>
    </SubscriptionProvider>
  </StrictMode>
);
