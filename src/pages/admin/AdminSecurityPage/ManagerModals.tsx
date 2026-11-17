import React from 'react';
import { Check, KeyRound, Loader2, UserPlus, X } from 'lucide-react';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { PasswordStrengthMeter } from '../../../components/admin/PasswordStrengthMeter';
import type { Profile } from '../../../types/database';

interface ManagerModalsProps {
  createModalOpen: boolean;
  newMgrName: string;
  newMgrEmail: string;
  newMgrPassword: string;
  creatingMgr: boolean;
  resetTarget: Profile | null;
  resetPasswordValue: string;
  resettingMgrPassword: boolean;
  deleteTarget: Profile | null;
  deletingMgr: boolean;
  onChangeNewMgrName: (v: string) => void;
  onChangeNewMgrEmail: (v: string) => void;
  onChangeNewMgrPassword: (v: string) => void;
  onCreateManager: (e: React.FormEvent) => void;
  onCloseCreateModal: () => void;
  onChangeResetPasswordValue: (v: string) => void;
  onResetManagerPassword: (e: React.FormEvent) => void;
  onCloseResetModal: () => void;
  onConfirmDelete: () => void;
  onCloseDeleteModal: () => void;
}

export const ManagerModals: React.FC<ManagerModalsProps> = ({
  createModalOpen,
  newMgrName,
  newMgrEmail,
  newMgrPassword,
  creatingMgr,
  resetTarget,
  resetPasswordValue,
  resettingMgrPassword,
  deleteTarget,
  deletingMgr,
  onChangeNewMgrName: setNewMgrName,
  onChangeNewMgrEmail: setNewMgrEmail,
  onChangeNewMgrPassword: setNewMgrPassword,
  onCreateManager: handleCreateSubManager,
  onCloseCreateModal,
  onChangeResetPasswordValue: setResetPasswordValue,
  onResetManagerPassword: handleOwnerResetPassword,
  onCloseResetModal,
  onConfirmDelete: handleOwnerConfirmDelete,
  onCloseDeleteModal,
}) => {
  return (
    <>
      {createModalOpen && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div
            onClick={() => onCloseCreateModal()}
            className="fixed inset-0 bg-coffee-dark/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-md bg-ivory-light border border-coffee-beige rounded-brand shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-ivory border-b border-coffee-beige flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-coffee" />
                <h3 className="font-serif text-xl font-semibold text-coffee-dark">
                  Thêm Tài Khoản Quản Lý Mới
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onCloseCreateModal()}
                className="p-1 text-coffee-muted hover:text-coffee-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubManager} className="p-6 space-y-4">
              <p className="text-xs text-coffee-muted leading-relaxed">
                Tạo tài khoản Quản lý để nhân sự có thể đăng nhập vào trang <code className="font-mono">/admin</code> và phụ giúp bạn cập nhật món, hình ảnh.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Họ và Tên Quản lý *
                </label>
                <input
                  type="text"
                  required
                  value={newMgrName}
                  onChange={(e) => setNewMgrName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A (Quản lý ca)"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Email đăng nhập *
                </label>
                <input
                  type="email"
                  required
                  value={newMgrEmail}
                  onChange={(e) => setNewMgrEmail(e.target.value)}
                  placeholder="quanly@tunncoffee.com"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Mật khẩu khởi tạo (Tối thiểu 12 ký tự) *
                </label>
                <input
                  type="text"
                  required
                  minLength={12}
                  value={newMgrPassword}
                  onChange={(e) => setNewMgrPassword(e.target.value)}
                  placeholder="Nhập hoặc tạo mật khẩu mạnh cho quản lý..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand font-mono"
                />
                <PasswordStrengthMeter
                  password={newMgrPassword}
                  email={newMgrEmail}
                  showCopy
                  onGenerate={(generated) => setNewMgrPassword(generated)}
                />
              </div>

              <div className="pt-3 border-t border-coffee-beige flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onCloseCreateModal()}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-coffee-beige rounded-brand"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creatingMgr}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand disabled:opacity-50"
                >
                  {creatingMgr ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Tạo Tài Khoản Quản Lý</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: OWNER RESETS PASSWORD FOR SUB-MANAGER */}
      {resetTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div
            onClick={() => onCloseResetModal()}
            className="fixed inset-0 bg-coffee-dark/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-md bg-ivory-light border border-coffee-beige rounded-brand shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-ivory border-b border-coffee-beige flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-coffee" />
                <h3 className="font-serif text-xl font-semibold text-coffee-dark">
                  Cấp Mật Khẩu Mới Cho Quản Lý
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onCloseResetModal()}
                className="p-1 text-coffee-muted hover:text-coffee-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOwnerResetPassword} className="p-6 space-y-4">
              <div className="p-3 bg-white border border-coffee-beige rounded-brand text-xs">
                <p className="font-semibold text-coffee-dark">
                  {resetTarget.full_name}
                </p>
                <p className="text-coffee-muted">{resetTarget.email}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Nhập mật khẩu mới (Tối thiểu 12 ký tự) *
                </label>
                <input
                  type="text"
                  required
                  minLength={12}
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Nhập hoặc tạo mật khẩu mạnh để cấp cho quản lý..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-coffee-beige rounded-brand font-mono"
                />
                <PasswordStrengthMeter
                  password={resetPasswordValue}
                  email={resetTarget.email}
                  showCopy
                  onGenerate={(generated) => setResetPasswordValue(generated)}
                />
              </div>

              <div className="pt-3 border-t border-coffee-beige flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => onCloseResetModal()}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-coffee-beige rounded-brand"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={resettingMgrPassword}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand disabled:opacity-50"
                >
                  {resettingMgrPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Xác Nhận Cấp Mật Khẩu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG: OWNER DELETES SUB-MANAGER */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa tài khoản Quản lý?"
        description={`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản quản lý "${deleteTarget?.full_name}" (${deleteTarget?.email})? Người này sẽ lập tức mất quyền đăng nhập vào hệ thống Admin.`}
        confirmLabel="Xóa tài khoản này"
        loading={deletingMgr}
        onConfirm={handleOwnerConfirmDelete}
        onCancel={() => onCloseDeleteModal()}
      />
    </>
  );
};
