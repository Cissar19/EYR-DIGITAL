import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-red-100 p-8">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">¡Algo salió mal! 🚨</h1>
                        <p className="text-slate-600 mb-6">
                            La aplicación ha encontrado un error crítico y no puede continuar.
                        </p>

                        <div className="bg-slate-900 rounded-xl p-4 overflow-auto mb-6">
                            <code className="text-sm font-mono text-red-300 block mb-2">
                                {this.state.error && this.state.error.toString()}
                            </code>
                            <details className="text-xs font-mono text-slate-500 cursor-pointer">
                                <summary className="mb-2 hover:text-slate-300">Ver Stack Trace</summary>
                                <div className="pl-4 border-l-2 border-slate-700 whitespace-pre-wrap">
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </div>
                            </details>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors w-full sm:w-auto"
                        >
                            Recargar Aplicación
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
