import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error", error, info.componentStack);
  }

  render() {
    const english = localStorage.getItem("averis-language") === "en";
    if (this.state.failed)
      return (
        <main className="public-wrap">
          <section className="sheet" role="alert">
            <AlertTriangle size={30} />
            <h1>
              {english
                ? "The application encountered a problem"
                : "Aplikasi mengalami kendala"}
            </h1>
            <p>
              {english
                ? "Reload this page. If the problem continues, contact your organization administrator."
                : "Muat ulang halaman. Jika masalah berlanjut, hubungi administrator organisasi Anda."}
            </p>
            <button
              className="btn primary"
              onClick={() => window.location.reload()}
            >
              {english ? "Reload page" : "Muat ulang"}
            </button>
          </section>
        </main>
      );
    return this.props.children;
  }
}
