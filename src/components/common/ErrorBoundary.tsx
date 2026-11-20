import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI ErrorBoundary caught an error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] w-full flex items-center justify-center p-6 bg-ivory-light text-coffee-dark">
          <div className="max-w-md w-full bg-white border border-coffee-beige rounded-2xl p-6 text-center space-y-4 shadow-editorial">
            <AlertTriangle className="w-9 h-9 text-amber-700 mx-auto" />
            <div className="space-y-1.5">
              <h2 className="font-serif text-xl font-medium text-coffee-dark">
                {this.props.fallbackTitle || 'Trang gặp sự cố hiển thị'}
              </h2>
              <p className="text-xs text-coffee-muted leading-relaxed">
                Rất tiếc, nội dung này vừa gặp lỗi tạm thời. Bạn có thể tải lại trang để tiếp tục sử dụng bình thường.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-coffee hover:bg-coffee-dark text-ivory-light text-xs font-medium transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại trang</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
