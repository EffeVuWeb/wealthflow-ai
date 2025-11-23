import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
                    <div className="max-w-lg w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl">
                        <h1 className="text-2xl font-bold text-rose-500 mb-4">Qualcosa è andato storto</h1>
                        <p className="text-slate-300 mb-4">Si è verificato un errore imprevisto nell'applicazione.</p>
                        <div className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-60 mb-6 border border-slate-800">
                            <code className="text-xs font-mono text-rose-300 whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </code>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Ricarica Pagina
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
