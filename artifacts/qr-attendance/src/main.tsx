import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setAuthTokenRefresher, setBaseUrl } from "@workspace/api-client-react";
import { ensureFreshToken } from "./contexts/AuthContext";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => localStorage.getItem("qr_token"));
setAuthTokenRefresher(() => ensureFreshToken());

// Dev → local API server; Production → Vercel backend URL
if (import.meta.env.DEV) {
  setBaseUrl("http://localhost:3000");
} else if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById("root")!).render(<App />);
// force redeploy 3
