import React from 'react';
import { Activity, Clock, Eye, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { formatDateTimeVi, formatDurationVi } from '../../../lib/utils';
import type { AdminActivityLog, Profile } from '../../../types/database';

export interface ManagerActivitySummaryRow {
  email: string;
  fullName: string | unknown;
  profile: Profile | null;
  isOnline: boolean;
  latestLog?: AdminActivityLog;
  currentPage: string | unknown;
  latestSessionDurationSec: number;
  totalDurationSec: number;
  sessionCount: number;
  totalActions: number;
  dataEditCount: number;
  pageViewCount: number;
}

interface ActivityAuditSectionProps {
  isOwnerAdmin: boolean;
  clearingLogs: boolean;
  refreshingLogs: boolean;
  managerActivitySummary: ManagerActivitySummaryRow[];
  allProfiles: Profile[];
  activityLogs: AdminActivityLog[];
  filteredActivityLogs: AdminActivityLog[];
  selectedManagerEmail: string;
  selectedActionCategory: 'all' | 'data' | 'navigation' | 'session';
  getLogBadge: (log: AdminActivityLog) => { label: string; cls: string };
  onRefreshLogs: () => void;
  onChangeSelectedManager: (email: string) => void;
  onChangeActionCategory: (cat: 'all' | 'data' | 'navigation' | 'session') => void;
  onClearLogs: () => void;
}

export const ActivityAuditSection: React.FC<ActivityAuditSectionProps> = ({
  isOwnerAdmin,
  clearingLogs,
  refreshingLogs,
  managerActivitySummary,
  allProfiles,
  activityLogs,
  filteredActivityLogs,
  selectedManagerEmail,
  selectedActionCategory,
  getLogBadge,
  onRefreshLogs: handleRefreshLogs,
  onChangeSelectedManager: setSelectedManagerEmail,
  onChangeActionCategory: setSelectedActionCategory,
  onClearLogs: handleClearLogs,
}) => {
  return (
      <div className="bg-white border border-coffee-beige rounded-brand p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-coffee-beige">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-coffee" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                Giám Sát Thời Gian Hoạt Động & Nhật Ký Thao Tác Của Quản Lý
              </h2>
              <p className="text-xs text-coffee-muted">
                Theo dõi xem từng Quản lý đang online hay offline, đang mở trang nào, hoạt động trong bao lâu và đã chỉnh sửa những gì.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={refreshingLogs}
              onClick={handleRefreshLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-ivory-light text-coffee-dark border border-coffee-beige hover:bg-ivory rounded-brand transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${refreshingLogs ? 'animate-spin' : ''}`}
              />
              <span>Làm mới nhật ký</span>
            </button>

            {isOwnerAdmin && activityLogs.length > 0 && (
              <button
                type="button"
                disabled={clearingLogs}
                onClick={handleClearLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-brand transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nhật ký</span>
              </button>
            )}
          </div>
        </div>

        {/* SUB-SECTION 2A: PER-MANAGER ONLINE STATUS & ACTIVE DURATION SUMMARY */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-coffee">
            1. Thống Kê Thời Gian Trực & Trạng Thái Hoạt Động Theo Từng Quản Lý
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-ivory">
              <thead>
                <tr className="bg-ivory-light border-b border-coffee-beige text-[11px] uppercase tracking-wider text-coffee-dark font-semibold">
                  <th className="py-2.5 px-3.5">Quản lý</th>
                  <th className="py-2.5 px-3.5">Trạng thái & Trang đang xem</th>
                  <th className="py-2.5 px-3.5">Thời gian phiên gần nhất</th>
                  <th className="py-2.5 px-3.5">Tổng thời gian hoạt động</th>
                  <th className="py-2.5 px-3.5">Tổng thao tác</th>
                  <th className="py-2.5 px-3.5 text-right">Lọc xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory text-xs">
                {managerActivitySummary.map((mgr) => {
                  const isSelected =
                    selectedManagerEmail.toLowerCase() === mgr.email.toLowerCase();

                  return (
                    <tr
                      key={mgr.email}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-amber-50/70'
                          : 'hover:bg-ivory-light/60'
                      }`}
                    >
                      <td className="py-3 px-3.5">
                        <p className="font-semibold text-coffee-dark">
                          {String(mgr.fullName)}
                        </p>
                        <p className="text-[11px] text-coffee-muted">{mgr.email}</p>
                      </td>

                      <td className="py-3 px-3.5">
                        {mgr.isOnline ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-900 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                              <span>Đang trực tuyến (Online)</span>
                            </span>
                            <p className="text-[11px] text-coffee font-medium">
                              Đang ở: {String(mgr.currentPage)}
                            </p>
                          </div>
                        ) : mgr.latestLog ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-700 rounded-full">
                              <span className="w-2 h-2 rounded-full bg-stone-400" />
                              <span>Ngoại tuyến</span>
                            </span>
                            <p className="text-[11px] text-coffee-muted">
                              Hoạt động cuối: {formatDateTimeVi(mgr.latestLog.created_at)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-coffee-muted italic">
                            Chưa từng đăng nhập
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {mgr.latestSessionDurationSec > 0 ? (
                          <span className="font-semibold text-coffee-dark">
                            {formatDurationVi(mgr.latestSessionDurationSec)}
                          </span>
                        ) : (
                          <span className="text-coffee-muted">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {mgr.totalDurationSec > 0 ? (
                          <div>
                            <span className="font-bold text-coffee">
                              {formatDurationVi(mgr.totalDurationSec)}
                            </span>
                            <p className="text-[10px] text-coffee-muted">
                              ({mgr.sessionCount} phiên đăng nhập)
                            </p>
                          </div>
                        ) : (
                          <span className="text-coffee-muted">0 phút</span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-coffee-dark">
                          {mgr.totalActions} hành động
                        </span>
                        <p className="text-[10px] text-coffee-muted">
                          {mgr.dataEditCount} chỉnh sửa · {mgr.pageViewCount} xem trang
                        </p>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedManagerEmail(
                              isSelected ? 'all' : mgr.email
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-brand border transition-colors ${
                            isSelected
                              ? 'bg-coffee text-ivory-light border-coffee'
                              : 'bg-white text-coffee-dark border-coffee-beige hover:bg-ivory'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isSelected ? 'Đang lọc' : 'Xem chi tiết'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUB-SECTION 2B: DETAILED ACTION LOGS & FILTERS */}
        <div className="space-y-3 pt-2 border-t border-ivory">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-coffee flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>
                2. Nhật Ký Chi Tiết Từng Hành Động ({filteredActivityLogs.length} bản ghi)
              </span>
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedManagerEmail}
                onChange={(e) => setSelectedManagerEmail(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-ivory-light border border-coffee-beige rounded-brand text-coffee-dark"
              >
                <option value="all">Tất cả Quản lý ({managerActivitySummary.length})</option>
                {managerActivitySummary.map((m) => (
                  <option key={m.email} value={m.email}>
                    {String(m.fullName)} ({m.email})
                  </option>
                ))}
              </select>

              <select
                value={selectedActionCategory}
                onChange={(e) =>
                  setSelectedActionCategory(
                    e.target.value as 'all' | 'data' | 'navigation' | 'session'
                  )
                }
                className="px-3 py-1.5 text-xs font-medium bg-ivory-light border border-coffee-beige rounded-brand text-coffee-dark"
              >
                <option value="all">Mọi hoạt động (Chỉnh sửa + Xem trang + Đăng nhập)</option>
                <option value="data">Chỉ xem: Chỉnh sửa dữ liệu (Món, Giá, Cài đặt...)</option>
                <option value="navigation">Chỉ xem: Di chuyển & Xem các trang</option>
                <option value="session">Chỉ xem: Đăng nhập, Đăng xuất & Bảo mật</option>
              </select>
            </div>
          </div>

          {filteredActivityLogs.length === 0 ? (
            <p className="text-xs text-coffee-muted py-8 text-center bg-ivory-light border border-dashed border-coffee-beige rounded-brand">
              Chưa có hoạt động nào khớp với bộ lọc hiện tại.
            </p>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredActivityLogs.map((log) => {
                const badge = getLogBadge(log);
                const durationSec = Number(log.details?.session_duration_sec || 0);
                const actorName =
                  allProfiles.find(
                    (p) =>
                      p.email?.toLowerCase() ===
                      (log.actor_email || '').toLowerCase()
                  )?.full_name ||
                  log.details?.actor_name ||
                  log.actor_email ||
                  'Quản lý';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-ivory-light border border-coffee-beige/80 rounded-brand text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-coffee/50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="font-semibold text-coffee-dark text-sm">
                          {log.action}
                        </span>
                        {log.entity_name && (
                          <span className="font-medium text-coffee bg-white px-2 py-0.5 rounded border border-coffee-beige/60">
                            {log.entity_name}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-coffee-muted">
                        <span>
                          Thực hiện bởi:{' '}
                          <strong className="text-coffee-dark">{String(actorName)}</strong> (
                          {log.actor_email || 'Admin'})
                        </span>
                        {durationSec > 0 && (
                          <span className="inline-flex items-center gap-1 text-coffee font-medium">
                            <Clock className="w-3 h-3" />
                            <span>
                              Đã hoạt động trong phiên: {formatDurationVi(durationSec)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="inline-block px-2.5 py-1 bg-white border border-coffee-beige rounded text-[11px] font-mono text-coffee-dark">
                        {formatDateTimeVi(log.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
};
