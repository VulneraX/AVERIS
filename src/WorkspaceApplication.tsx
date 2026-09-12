import "./intelligence/intelligence.css";
import App from "./App";
import { AuthProvider } from "./auth";
import { LocaleProvider } from "./ui";
export default function WorkspaceApplication() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LocaleProvider>
  );
}
