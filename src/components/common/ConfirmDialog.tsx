import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, m } from 'framer-motion';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-md bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-xl p-6 text-[#241914]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    variant === 'danger'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-[#E9E6D8] text-[#4B2E24]'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-[#241914]">
                    {title}
                  </h3>
                  <p className="text-sm text-[#8C7565] mt-1.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="text-[#8C7565] hover:text-[#241914] p-1"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium uppercase tracking-wider border border-[#D5C6AD] text-[#241914] hover:bg-[#E9E6D8] rounded-brand transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#F7F5EF] rounded-brand transition-colors disabled:opacity-50 ${
                  variant === 'danger'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-[#4B2E24] hover:bg-[#241914]'
                }`}
              >
                {loading ? 'Đang xử lý...' : confirmLabel}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
