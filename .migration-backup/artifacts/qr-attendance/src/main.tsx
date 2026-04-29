import { createRoot } from "react-dom/client";
import { setAuthTokenGetter, setAuthTokenRefresher } from "@workspace/api-client-react";
import { ensureFreshToken } from "@/contexts/AuthContext";
import App from "./App";
import "./index.css";

setAuthTokenGetter(() => localStorage.getItem("qr_token"));
setAuthTokenRefresher(() => ensureFreshToken());

createRoot(document.getElementById("root")!).render(<App />);
