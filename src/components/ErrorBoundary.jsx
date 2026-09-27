import React from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Download, ShieldCheck } from 'lucide-react';
import { recordError, downloadDiagnosticReport } from '../utils/errorTelemetry';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    recordError(error, { componentStack: errorInfo?.componentStack });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopyLog = () => {
    const errorDetails = `[TradePigeon Error Report]\nTimestamp: ${new Date().toISOString()}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }).catch(() => {
        this.fallbackCopy(errorDetails);
      });
    } else {
      this.fallbackCopy(errorDetails);
    }
  };

  fallbackCopy = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch (_) {}
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070C1E] flex items-center justify-center p-4 text-white">
          <div className="duo-card max-w-lg w-full p-6 sm:p-8 space-y-6 border-2 border-rose-500 shadow-2xl text-center">
            
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border-2 border-rose-500 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Something Went Off-Track</h2>
              <p className="text-xs font-bold text-slate-300 leading-relaxed max-w-md mx-auto">
                Your local trade journals and settings are completely safe. The rendering engine encountered an unexpected runtime exception.
              </p>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-2xl bg-[#0D1635] border border-[#20325C] text-left text-xs font-mono text-rose-300 overflow-x-auto max-h-36">
              <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Error Trace:</div>
              <div>{this.state.error?.message || 'Unknown render exception'}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="duo-btn-green flex-1 py-3 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleCopyLog}
                className="duo-btn-blue flex-1 py-3 text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {this.state.copied ? <Check size={14} className="text-[#58CC02]" /> : <Copy size={14} />}
                <span>{this.state.copied ? 'Copied Log!' : 'Copy Log'}</span>
              </button>
            </div>

            {/* Diagnostic Download & Reassurance */}
            <div className="pt-2 border-t border-[#20323D] flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-[#58CC02]">
                <ShieldCheck size={14} />
                <span>Data Preserved</span>
              </span>

              <button
                onClick={downloadDiagnosticReport}
                className="text-[#1CB0F6] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Download size={12} />
                <span>Download Diagnostics (JSON)</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
