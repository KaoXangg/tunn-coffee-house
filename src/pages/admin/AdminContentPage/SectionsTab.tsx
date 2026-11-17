import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpRight, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import type { PageSection } from '../../../types/database';

interface SectionsTabProps {
  orderedSections: PageSection[];
  savingOrder: boolean;
  onSaveOrder: () => void;
  onMoveSection: (index: number, direction: -1 | 1) => void;
  onToggleVisibility: (key: PageSection['section_key']) => void;
  onUpdateHeaderField: (
    key: PageSection['section_key'],
    field: 'title' | 'subtitle',
    value: string
  ) => void;
  onUpdateContentValue: (
    key: PageSection['section_key'],
    contentField: string,
    value: string
  ) => void;
  onUpdateEyebrow: (key: PageSection['section_key'], value: string) => void;
  onSwitchToAbout: () => void;
}

const SECTION_LABELS: Record<PageSection['section_key'], string> = {
  hero: 'Đầu trang (Hero)',
  about: 'Câu chuyện thương hiệu (About)',
  featured: 'Tác phẩm nổi bật (Featured)',
  menu: 'Thực đơn (Menu)',
  promotions: 'Ưu đãi & Mùa vị mới (Promotions)',
  gallery: 'Không gian & Khoảnh khắc (Gallery)',
  contact: 'Địa điểm & Liên hệ (Contact)',
};

const SECTION_EDIT_LINKS: Partial<
  Record<PageSection['section_key'], { label: string; to?: string; tab?: 'about' }>
> = {
  hero: { label: 'Chỉnh ảnh & nút Hero', to: '/admin/sections/hero' },
  about: { label: 'Chỉnh bài viết, ảnh & 3 trụ cột', tab: 'about' },
  featured: { label: 'Quản lý món nổi bật', to: '/admin/products' },
  menu: { label: 'Quản lý món & danh mục', to: '/admin/products' },
  promotions: { label: 'Quản lý khuyến mãi', to: '/admin/promotions' },
  gallery: { label: 'Quản lý thư viện ảnh', to: '/admin/gallery' },
  contact: { label: 'Chỉnh địa chỉ, SĐT & bản đồ', to: '/admin/settings/contact' },
};

export const SectionsTab: React.FC<SectionsTabProps> = ({
  orderedSections,
  savingOrder,
  onSaveOrder: handleSaveSectionsOrder,
  onMoveSection: moveSection,
  onToggleVisibility: toggleSectionVisibility,
  onUpdateHeaderField: updateSectionHeaderField,
  onUpdateContentValue: updateSectionContentValue,
  onUpdateEyebrow: updateSectionEyebrow,
  onSwitchToAbout,
}) => {
  const setActiveTab = (tab: string) => {
    if (tab === 'about') onSwitchToAbout();
  };

  return (
        <div className="bg-white border border-coffee-beige rounded-brand p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-coffee-beige">
            <div>
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                Bố Cục Các Phân Khu Trên Trang Chủ
              </h2>
              <p className="text-xs text-coffee-muted">
                Sử dụng mũi tên Lên / Xuống để thay đổi thứ tự xuất hiện của từng phần trên trang khách hàng.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveSectionsOrder}
              disabled={savingOrder}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand"
            >
              {savingOrder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Lưu Bố Cục Trang Chủ</span>
            </button>
          </div>

          <div className="space-y-3">
            {orderedSections.map((sec, idx) => (
              <div
                key={sec.section_key}
                className={`p-4 border rounded-brand flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  sec.is_enabled
                    ? 'bg-ivory-light border-coffee-beige'
                    : 'bg-stone-100 border-stone-300 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      className="p-1 border border-coffee-beige bg-white rounded disabled:opacity-30"
                      title="Đưa lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedSections.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      className="p-1 border border-coffee-beige bg-white rounded disabled:opacity-30"
                      title="Đưa xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-widest font-semibold text-coffee">
                        #{sec.sort_order} · {SECTION_LABELS[sec.section_key] || sec.section_key.toUpperCase()}
                      </span>
                      {SECTION_EDIT_LINKS[sec.section_key]?.to ? (
                        <Link
                          to={SECTION_EDIT_LINKS[sec.section_key]!.to!}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-coffee hover:underline"
                        >
                          <span>{SECTION_EDIT_LINKS[sec.section_key]!.label}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      ) : SECTION_EDIT_LINKS[sec.section_key]?.tab ? (
                        <button
                          type="button"
                          onClick={() => setActiveTab('about')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-coffee hover:underline"
                        >
                          <span>{SECTION_EDIT_LINKS[sec.section_key]!.label}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-coffee-muted">
                          Nhãn nhỏ phía trên (Eyebrow)
                        </label>
                        <input
                          type="text"
                          value={
                            sec.section_key === 'hero'
                              ? String(sec.content?.badge ?? sec.content?.eyebrow ?? '')
                              : String(sec.content?.eyebrow ?? '')
                          }
                          onChange={(e) =>
                            updateSectionEyebrow(sec.section_key, e.target.value)
                          }
                          placeholder="VD: SEASONAL & ARTISANAL MENU"
                          className="mt-1 w-full px-3 py-1.5 text-xs uppercase tracking-wider bg-white border border-coffee-beige rounded-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-coffee">
                          Tiêu đề chính (Title)
                        </label>
                        <input
                          type="text"
                          value={
                            sec.section_key === 'hero' || sec.section_key === 'about'
                              ? String(sec.content?.headline ?? sec.title ?? '')
                              : sec.title
                          }
                          onChange={(e) =>
                            updateSectionHeaderField(
                              sec.section_key,
                              'title',
                              e.target.value
                            )
                          }
                          className="mt-1 w-full px-3 py-1.5 text-sm font-semibold bg-white border border-coffee-beige rounded-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-coffee-muted">
                          Mô tả phụ (Subtitle)
                        </label>
                        <input
                          type="text"
                          value={
                            sec.section_key === 'hero'
                              ? String(sec.content?.subheadline ?? sec.subtitle ?? '')
                              : sec.section_key === 'about'
                              ? String(sec.content?.lead_paragraph ?? sec.subtitle ?? '')
                              : sec.subtitle
                          }
                          onChange={(e) =>
                            updateSectionHeaderField(
                              sec.section_key,
                              'subtitle',
                              e.target.value
                            )
                          }
                          className="mt-1 w-full px-3 py-1.5 text-sm bg-white border border-coffee-beige rounded-brand"
                        />
                      </div>
                    </div>
                    {sec.section_key === 'menu' && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-coffee-muted">
                          Ghi chú cuối mục Thực đơn
                        </label>
                        <input
                          type="text"
                          value={String(sec.content?.note ?? '')}
                          onChange={(e) =>
                            updateSectionContentValue('menu', 'note', e.target.value)
                          }
                          placeholder="VD: Tất cả đồ uống có thể tùy chỉnh mức đường và đá..."
                          className="mt-1 w-full px-3 py-1.5 text-xs bg-white border border-coffee-beige rounded-brand"
                        />
                      </div>
                    )}
                    {sec.section_key === 'contact' && (
                      <div className="pt-2.5 mt-1 border-t border-coffee-beige/60 space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-coffee">
                          Mục Cảm nhận Khách hàng (Hiển thị ngay phía trên Liên hệ)
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2.5">
                          <input
                            type="text"
                            value={String(sec.content?.reviews_eyebrow ?? 'CẢM NHẬN TỪ KHÁCH HÀNG')}
                            onChange={(e) =>
                              updateSectionContentValue('contact', 'reviews_eyebrow', e.target.value)
                            }
                            placeholder="Nhãn nhỏ (Eyebrow)"
                            className="px-3 py-1.5 text-xs uppercase tracking-wider bg-white border border-coffee-beige rounded-brand"
                          />
                          <input
                            type="text"
                            value={String(sec.content?.reviews_title ?? 'Khách Hàng Nói Gì Về TUNN')}
                            onChange={(e) =>
                              updateSectionContentValue('contact', 'reviews_title', e.target.value)
                            }
                            placeholder="Tiêu đề chính"
                            className="px-3 py-1.5 text-sm font-semibold bg-white border border-coffee-beige rounded-brand"
                          />
                          <input
                            type="text"
                            value={String(
                              sec.content?.reviews_subtitle ??
                                'Những chia sẻ chân thực từ khách ghé quán là động lực để chúng tôi chăm chút từng ly trà và cà phê mỗi ngày.'
                            )}
                            onChange={(e) =>
                              updateSectionContentValue('contact', 'reviews_subtitle', e.target.value)
                            }
                            placeholder="Mô tả phụ"
                            className="px-3 py-1.5 text-xs bg-white border border-coffee-beige rounded-brand"
                          />
                          <input
                            type="text"
                            value={String(sec.content?.reviews_cta_label ?? 'Viết đánh giá')}
                            onChange={(e) =>
                              updateSectionContentValue('contact', 'reviews_cta_label', e.target.value)
                            }
                            placeholder="Chữ nút bấm"
                            className="px-3 py-1.5 text-xs font-medium bg-white border border-coffee-beige rounded-brand"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(sec.section_key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-brand ${
                      sec.is_enabled
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-500 text-white'
                    }`}
                  >
                    {sec.is_enabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Đang bật</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Đang ẩn</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
  );
};
