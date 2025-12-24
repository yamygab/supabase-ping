
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
          <div className="max-w-md text-center bg-[#1a1a1a] p-8 rounded-2xl border border-red-900/50 shadow-2xl">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2 font-display">System Error</h2>
            <p className="text-gray-400 mb-8 text-sm leading-relaxed">
              We encountered an unexpected issue while rendering this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center mx-auto"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
