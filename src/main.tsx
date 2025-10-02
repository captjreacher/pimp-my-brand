import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SubscriptionProvider>
      <App />
    </SubscriptionProvider>
  </StrictMode>
);
