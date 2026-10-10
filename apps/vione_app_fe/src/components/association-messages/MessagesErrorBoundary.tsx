import React, { Component, ReactNode } from "react";
import { MessageSquare } from "lucide-react";

export interface MessagesErrorBoundaryProps {
  children: ReactNode;
}

export interface MessagesErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class MessagesErrorBoundary extends Component<MessagesErrorBoundaryProps, MessagesErrorBoundaryState> {
  constructor(props: MessagesErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): MessagesErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("MessagesScreen caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
            <MessageSquare className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Không thể tải tin nhắn</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Đã có sự cố kết nối hoặc dữ liệu hiển thị. Vui lòng bấm thử lại để làm mới giao diện.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#003B95] text-white text-xs font-bold hover:bg-[#002B70] transition shadow-sm cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
