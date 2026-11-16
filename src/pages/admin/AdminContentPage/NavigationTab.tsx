import React from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';

export interface NavItemEntry {
  label: string;
  href: string;
}

export interface DeletedNavItemEntry extends NavItemEntry {
  originalIndex: number;
}

interface NavigationTabProps {
  navItems: NavItemEntry[];
  restorableNavItems: DeletedNavItemEntry[];
  headerCtaLabel: string;
  headerCtaHref: string;
  footerDesc: string;
  copyright: string;
  savingNav: boolean;
  onChangeNavItems: React.Dispatch<React.SetStateAction<NavItemEntry[]>>;
  onMarkDirty: () => void;
  onMoveNavItem: (index: number, direction: -1 | 1) => void;
  onAddNavItem: () => void;
  onDeleteNavItem: (index: number) => void;
  onRestoreSingleNavItem: (item: DeletedNavItemEntry) => void;
  onRestoreDefaultNav: () => void;
  onChangeHeaderCtaLabel: (value: string) => void;
  onChangeHeaderCtaHref: (value: string) => void;
  onChangeFooterDesc: (value: string) => void;
  onChangeCopyright: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const NavigationTab: React.FC<NavigationTabProps> = ({
  navItems,
  restorableNavItems,
  headerCtaLabel,
  headerCtaHref,
  footerDesc,
  copyright,
  savingNav,
  onChangeNavItems: setNavItems,
  onMarkDirty,
  onMoveNavItem: moveNavItem,
  onAddNavItem: handleAddNavItem,
  onDeleteNavItem: handleDeleteNavItem,
  onRestoreSingleNavItem: handleRestoreSingleNavItem,
  onRestoreDefaultNav: handleRestoreDefaultNav,
  onChangeHeaderCtaLabel: setHeaderCtaLabel,
  onChangeHeaderCtaHref: setHeaderCtaHref,
  onChangeFooterDesc: setFooterDesc,
  onChangeCopyright: setCopyright,
  onSubmit: handleSaveNavigationAndFooter,
}) => {
  return (
        <form
          onSubmit={handleSaveNavigationAndFooter}
          className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#D5C6AD]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Thanh Điều Hướng (Header Navigation) & Chân Trang (Footer)
              </h2>
              <p className="text-xs text-[#8C7565]">
                Tùy chỉnh các mục menu trên Header, nút CTA và nội dung bản quyền dưới Footer.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingNav}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] rounded-brand"
            >
              {savingNav ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Lưu Navigation & Footer</span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#241914]">
                Các mục trên Thanh Menu (Navigation Items)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRestoreDefaultNav}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#F7F5EF] border border-[#D5C6AD] text-[#4B2E24] hover:bg-[#E9E6D8] rounded-brand"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Mặc định
                </button>
                <button
                  type="button"
                  onClick={handleAddNavItem}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm mục
                </button>
              </div>
            </div>

            {restorableNavItems.length > 0 && (
              <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C7565]">
                  Các ô đã xóa (bấm để khôi phục lại):
                </p>
                <div className="flex flex-wrap gap-2">
                  {restorableNavItems.map((item, rIdx) => (
                    <button
                      key={`${item.label}-${item.href}-${rIdx}`}
                      type="button"
                      onClick={() => handleRestoreSingleNavItem(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#3A221A] rounded-brand transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Khôi phục: {item.label || item.href}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        ({item.href})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {navItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveNavItem(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand text-[#4B2E24] disabled:opacity-30 hover:bg-[#E9E6D8]"
                      title="Đưa lên trên"
                      aria-label="Đưa mục lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNavItem(idx, 1)}
                      disabled={idx === navItems.length - 1}
                      className="p-1.5 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand text-[#4B2E24] disabled:opacity-30 hover:bg-[#E9E6D8]"
                      title="Đưa xuống dưới"
                      aria-label="Đưa mục xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...navItems];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setNavItems(next);
                      onMarkDirty();
                    }}
                    placeholder="Nhãn hiển thị"
                    className="flex-1 min-w-0 px-3 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => {
                      const next = [...navItems];
                      next[idx] = { ...next[idx], href: e.target.value };
                      setNavItems(next);
                      onMarkDirty();
                    }}
                    placeholder="#hero"
                    className="flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteNavItem(idx)}
                    className="p-2 text-red-700 hover:bg-red-50 rounded-brand shrink-0"
                    title="Xóa mục này"
                    aria-label="Xóa mục này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#D5C6AD]">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Nút CTA trên Header
              </label>
              <input
                type="text"
                value={headerCtaLabel}
                onChange={(e) => setHeaderCtaLabel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Liên kết nút CTA Header
              </label>
              <input
                type="text"
                value={headerCtaHref}
                onChange={(e) => setHeaderCtaHref(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#D5C6AD]">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Đoạn giới thiệu thương hiệu ở Footer
              </label>
              <textarea
                rows={2}
                value={footerDesc}
                onChange={(e) => setFooterDesc(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Dòng bản quyền (Copyright)
              </label>
              <input
                type="text"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>
        </form>
  );
};
