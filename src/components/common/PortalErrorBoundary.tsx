import React from 'react';
import { AlertTriangle, RefreshCw, MessageSquare } from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/formatters';

interface Props {
  children: React.ReactNode;
  orderId?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class PortalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Portal Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo: errorInfo.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || String(this.state.error || 'Terjadi kesalahan tidak terduga');
      const waText = `Halo Admin Arise Career Craft, saya mengalami kendala saat membuka formulir pesanan ${this.props.orderId || ''}:\n\nError: ${errorMessage}`;
      const waLink = generateWhatsAppLink('081288009900', waText);

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Portal Form tidak dapat dimuat.</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Terjadi kendala saat merender antarmuka formulir di perangkat Anda.
              </p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl text-left border border-slate-800 text-[11px] font-mono text-rose-300 break-all overflow-auto max-h-32">
              <span className="text-slate-500 block mb-0.5">Kode Error / Detail:</span>
              <code>{errorMessage}</code>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onRetry) {
                    this.props.onRetry();
                  } else {
                    window.location.reload();
                  }
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RefreshCw size={14} />
                <span>Coba Lagi</span>
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-95 text-center"
              >
                <MessageSquare size={14} />
                <span>Hubungi Seller</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
