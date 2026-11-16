import React from 'react';
import { Crown, KeyRound, Trash2, Users } from 'lucide-react';
import { formatDateVi } from '../../../lib/utils';
import type { Profile } from '../../../types/database';

interface ManagerTeamSectionProps {
  allProfiles: Profile[];
  loadingProfiles: boolean;
  isOwnerAdmin: boolean;
  currentUserId?: string;
  isProfileRootOwner: (p: Profile) => boolean;
  onChangeUserRole: (p: Profile, role: 'admin' | 'staff' | 'editor') => void;
  onOpenResetModal: (p: Profile) => void;
  onChangeResetPasswordValue: (v: string) => void;
  onRequestDelete: (p: Profile) => void;
}

export const ManagerTeamSection: React.FC<ManagerTeamSectionProps> = ({
  allProfiles,
  loadingProfiles,
  isOwnerAdmin,
  currentUserId,
  isProfileRootOwner,
  onChangeUserRole: handleChangeUserRole,
  onOpenResetModal: setResetTarget,
  onChangeResetPasswordValue: setResetPasswordValue,
  onRequestDelete: setDeleteTarget,
}) => {
  const user = currentUserId ? { id: currentUserId } : null;
  return (
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D5C6AD]">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-[#4B2E24]" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Danh Sách Ban Quản Trị & Phân Quyền ({allProfiles.length})
              </h2>
              <p className="text-xs text-[#8C7565]">
                Vai trò của bạn hiện tại:{' '}
                <strong className="text-[#4B2E24]">
                  {isOwnerAdmin
                    ? 'ADMIN GỐC (Toàn quyền thêm, xóa & cấp mật khẩu cho Quản lý con)'
                    : 'QUẢN LÝ VIÊN (Không thể xóa hoặc đổi mật khẩu của người khác)'}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {loadingProfiles ? (
          <div className="py-10 text-center text-xs text-[#8C7565]">
            Đang tải danh sách tài khoản...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#E9E6D8] border-b border-[#D5C6AD] text-[11px] uppercase tracking-wider text-[#241914] font-semibold">
                  <th className="py-3 px-4">Người dùng / Quản lý</th>
                  <th className="py-3 px-4">Cấp bậc</th>
                  <th className="py-3 px-4">Quyền vào Admin</th>
                  <th className="py-3 px-4">Ngày tạo</th>
                  <th className="py-3 px-4 text-right">
                    Thao tác (Chỉ Admin Gốc)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E6D8] text-sm">
                {allProfiles.map((p) => {
                  const isRoot = isProfileRootOwner(p);
                  const isSelf = p.id === user?.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#F7F5EF]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#241914]">
                            {p.full_name || 'Quản lý viên'}
                          </span>
                          {isSelf && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#E9E6D8] text-[#4B2E24] rounded">
                              Đang đăng nhập
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8C7565]">{p.email}</p>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRoot ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-brand">
                            <Crown className="w-3.5 h-3.5 text-amber-700" />
                            <span>Admin Gốc (Owner)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-[#F7F5EF] text-[#241914] border border-[#D5C6AD] rounded-brand">
                            <span>Quản lý con</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isRoot ? (
                          <span className="text-xs font-semibold text-emerald-800">
                            Toàn quyền cố định
                          </span>
                        ) : (
                          <select
                            value={p.role}
                            disabled={!isOwnerAdmin}
                            onChange={(e) =>
                              handleChangeUserRole(
                                p,
                                e.target.value as 'admin' | 'editor' | 'staff'
                              )
                            }
                            className={`px-3 py-1.5 text-xs font-semibold rounded-brand border ${
                              p.role === 'admin'
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                : 'bg-stone-100 text-stone-600 border-stone-300'
                            } disabled:opacity-60`}
                          >
                            <option value="admin">
                              Cho phép vào Admin (Active)
                            </option>
                            <option value="staff">
                              Tạm khóa quyền vào Admin
                            </option>
                          </select>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#8C7565] whitespace-nowrap">
                        {formatDateVi(p.created_at)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isRoot ? (
                          <span className="text-xs text-[#8C7565] italic">
                            Được bảo vệ
                          </span>
                        ) : isOwnerAdmin ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setResetTarget(p);
                                setResetPasswordValue('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand transition-colors"
                              title="Cấp mật khẩu mới cho quản lý này"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Cấp mật khẩu mới</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-brand transition-colors"
                              title="Xóa tài khoản quản lý này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8C7565] italic">
                            Chỉ Admin gốc được phép
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
};
