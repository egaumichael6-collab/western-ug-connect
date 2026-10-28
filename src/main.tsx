import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { supabaseConfigured } from "./lib/supabase";

function NotConfigured() {
  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 560, margin: "15vh auto", padding: 24 }}>
      <h1>WESTERN UG CONNECT is not configured yet</h1>
      <p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> (locally) or in Netlify's
        environment variables, then rebuild. See DEPLOYMENT.md.</p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {supabaseConfigured ? (
      <AuthProvider>
        <App />
      </AuthProvider>
    ) : (
      <NotConfigured />
    )}
  </StrictMode>,
);
