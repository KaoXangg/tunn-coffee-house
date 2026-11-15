import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_ABOUT_CONTENT } from '../../lib/defaultData';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { AboutSectionContent, PageSection } from '../../types/database';

export const AdminContentPage: React.FC = () => {
  const {
    sections,
    settings,
    getSection,
    updatePageSection,
    updateSiteSettings,
    refreshAll,
  } = useSiteData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'sections' | 'about' | 'navigation'>('sections');
  const [orderedSections, setOrderedSections] = useState<PageSection[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // About Section Editor State
  const aboutSec = getSection('about');
  const [aboutTitle, setAboutTitle] = useState(aboutSec?.title || '');
  const [aboutSubtitle, setAboutSubtitle] = useState(aboutSec?.subtitle || '');
  const [aboutContent, setAboutContent] = useState<AboutSectionContent>({
    ...DEFAULT_ABOUT_CONTENT,
    ...(aboutSec?.content || {}),
  });
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutMediaTarget, setAboutMediaTarget] = useState<'main' | 'secondary' | null>(null);

  // Navigation & Footer State
  const [navItems, setNavItems] = useState(settings.nav_items || []);
  const [headerCtaLabel, setHeaderCtaLabel] = useState(settings.header_cta_label);
  const [headerCtaHref, setHeaderCtaHref] = useState(settings.header_cta_href);
  const [footerDesc, setFooterDesc] = useState(settings.footer_description);
  const [copyright, setCopyright] = useState(settings.copyright_text);
  const [savingNav, setSavingNav] = useState(false);

  useEffect(() => {
    setOrderedSections([...sections].sort((a, b) => a.sort_order - b.sort_order));
  }, [sections]);

  useEffect(() => {
    if (aboutSec) {
      setAboutTitle(aboutSec.title);
      setAboutSubtitle(aboutSec.subtitle);
      setAboutContent({
        ...DEFAULT_ABOUT_CONTENT,
        ...(aboutSec.content || {}),
        pillars: Array.isArray(aboutSec.content?.pillars)
          ? aboutSec.content.pillars
          : DEFAULT_ABOUT_CONTENT.pillars,
      });
    }
  }, [aboutSec]);

  useEffect(() => {
    setNavItems(settings.nav_items || []);
    setHeaderCtaLabel(settings.header_cta_label);
    setHeaderCtaHref(settings.header_cta_href);
    setFooterDesc(settings.footer_description);
    setCopyright(settings.copyright_text);
  }, [settings]);

  const moveSection = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedSections.length) return;
    const clone = [...orderedSections];
    const temp = clone[index];
    clone[index] = clone[targetIndex];
    clone[targetIndex] = temp;
    setOrderedSections(
      clone.map((item, idx) => ({ ...item, sort_order: idx + 1 }))
    );
  };

  const toggleSectionVisibility = (key: PageSection['section_key']) => {
    setOrderedSections((prev) =>
      prev.map((sec) =>
        sec.section_key === key ? { ...sec, is_enabled: !sec.is_enabled } : sec
      )
    );
  };

  const SECTION_LABELS: Record<PageSection['section_key'], string> = {
    hero: 'Đầu trang (Hero)',
    about: 'Câu chuyện thương hiệu (About)',
    featured: 'Tác phẩm nổi bật (Featured)',
    menu: 'Thực đơn (Menu)',
    promotions: 'Ưu đãi & Mùa vị mới (Promotions)',
    gallery: 'Không gian & Khoảnh khắc (Gallery)',
    contact: 'Địa điểm & Liên hệ (Contact)',
  };

  const updateSectionHeaderField = (
    key: PageSection['section_key'],
    field: 'title' | 'subtitle',
    value: string
  ) => {
    setOrderedSections((prev) =>
      prev.map((sec) => {
        if (sec.section_key !== key) return sec;
        if (key === 'hero') {
          const contentField = field === 'title' ? 'headline' : 'subheadline';
          return {
            ...sec,
            [field]: value,
            content: { ...(sec.content || {}), [contentField]: value },
          };
        }
        return { ...sec, [field]: value };
      })
    );
  };

  const updateSectionEyebrow = (
    key: PageSection['section_key'],
    value: string
  ) => {
    setOrderedSections((prev) =>
      prev.map((sec) =>
        sec.section_key === key
          ? {
              ...sec,
              content: {
                ...(sec.content || {}),
                eyebrow: value,
                ...(key === 'hero' ? { badge: value } : {}),
              },
            }
          : sec
      )
    );
  };

  const handleSaveSectionsOrder = async () => {
    setSavingOrder(true);
    try {
      for (const sec of orderedSections) {
        if (isSupabaseConfigured) {
          await supabase.from('page_sections').upsert(
            {
              section_key: sec.section_key,
              title: sec.title,
              subtitle: sec.subtitle,
              is_enabled: sec.is_enabled,
              sort_order: sec.sort_order,
              content: sec.content,
            },
            { onConflict: 'section_key' }
          );
        } else {
          await updatePageSection(sec.section_key, {
            title: sec.title,
            subtitle: sec.subtitle,
            is_enabled: sec.is_enabled,
            sort_order: sec.sort_order,
            content: sec.content,
          });
        }
      }
      await refreshAll();
      toast.success(
        'Đã lưu cấu trúc & thứ tự các Section!',
        'Trang chủ khách hàng đã được cập nhật.'
      );
    } catch (err: any) {
      toast.error('Lỗi lưu thứ tự section', err?.message);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAbout(true);
    try {
      const { error } = await updatePageSection('about', {
        title: aboutTitle,
        subtitle: aboutSubtitle,
        content: aboutContent,
      });
      if (error) {
        toast.info('Đã cập nhật bản xem trước', error);
      } else {
        toast.success('Đã lưu Câu chuyện Thương hiệu (About Section)!');
      }
    } finally {
      setSavingAbout(false);
    }
  };

  const handleSaveNavigationAndFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNav(true);
    try {
      const { error } = await updateSiteSettings({
        nav_items: navItems,
        header_cta_label: headerCtaLabel,
        header_cta_href: headerCtaHref,
        footer_description: footerDesc,
        copyright_text: copyright,
      });
      if (error) {
        toast.info('Đã cập nhật tạm thời', error);
      } else {
        toast.success('Đã lưu Navigation & Footer!');
      }
    } finally {
      setSavingNav(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#241914]">
          Quản Lý Nội Dung Trang Chủ (Website Content)
        </h1>
        <p className="text-sm text-[#8C7565] mt-1">
          Bật/tắt các phân khu, sắp xếp lại thứ tự hiển thị trên trang chủ, chỉnh sửa câu chuyện thương hiệu và thanh điều hướng.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-[#D5C6AD] gap-6 text-xs font-semibold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'sections'
              ? 'border-[#4B2E24] text-[#241914]'
              : 'border-transparent text-[#8C7565] hover:text-[#241914]'
          }`}
        >
          1. Thứ Tự & Tiêu Đề Các Section
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'about'
              ? 'border-[#4B2E24] text-[#241914]'
              : 'border-transparent text-[#8C7565] hover:text-[#241914]'
          }`}
        >
          2. Câu Chuyện Thương Hiệu (About)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('navigation')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'navigation'
              ? 'border-[#4B2E24] text-[#241914]'
              : 'border-transparent text-[#8C7565] hover:text-[#241914]'
          }`}
        >
          3. Menu Điều Hướng & Footer
        </button>
      </div>

      {/* TAB 1: Reorder & Toggle Sections */}
      {activeTab === 'sections' && (
        <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D5C6AD]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Bố Cục Các Phân Khu Trên Trang Chủ
              </h2>
              <p className="text-xs text-[#8C7565]">
                Sử dụng mũi tên Lên / Xuống để thay đổi thứ tự xuất hiện của từng phần trên trang khách hàng.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveSectionsOrder}
              disabled={savingOrder}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand"
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
                    ? 'bg-[#F7F5EF] border-[#D5C6AD]'
                    : 'bg-stone-100 border-stone-300 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      className="p-1 border border-[#D5C6AD] bg-white rounded disabled:opacity-30"
                      title="Đưa lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedSections.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      className="p-1 border border-[#D5C6AD] bg-white rounded disabled:opacity-30"
                      title="Đưa xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] uppercase tracking-widest font-semibold text-[#4B2E24]">
                        #{sec.sort_order} · {SECTION_LABELS[sec.section_key] || sec.section_key.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#8C7565]">
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
                          className="mt-1 w-full px-3 py-1.5 text-xs uppercase tracking-wider bg-white border border-[#D5C6AD] rounded-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#4B2E24]">
                          Tiêu đề chính (Title)
                        </label>
                        <input
                          type="text"
                          value={
                            sec.section_key === 'hero'
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
                          className="mt-1 w-full px-3 py-1.5 text-sm font-semibold bg-white border border-[#D5C6AD] rounded-brand"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-semibold text-[#8C7565]">
                          Mô tả phụ (Subtitle)
                        </label>
                        <input
                          type="text"
                          value={
                            sec.section_key === 'hero'
                              ? String(sec.content?.subheadline ?? sec.subtitle ?? '')
                              : sec.subtitle
                          }
                          onChange={(e) =>
                            updateSectionHeaderField(
                              sec.section_key,
                              'subtitle',
                              e.target.value
                            )
                          }
                          className="mt-1 w-full px-3 py-1.5 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                        />
                      </div>
                    </div>
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
      )}

      {/* TAB 2: About Section Editor */}
      {activeTab === 'about' && (
        <form
          onSubmit={handleSaveAbout}
          className="bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#D5C6AD]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#241914]">
                Chỉnh Sửa Câu Chuyện Thương Hiệu (About Section)
              </h2>
              <p className="text-xs text-[#8C7565]">
                Quản lý triết lý thương hiệu, câu chuyện nguyên liệu, quy trình pha chế và 3 trụ cột giá trị.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingAbout}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] rounded-brand"
            >
              {savingAbout ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Lưu Câu Chuyện</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Nhãn Eyebrow
              </label>
              <input
                type="text"
                value={aboutContent.eyebrow}
                onChange={(e) =>
                  setAboutContent({ ...aboutContent, eyebrow: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Tiêu đề nghệ thuật (Headline)
              </label>
              <input
                type="text"
                value={aboutContent.headline}
                onChange={(e) =>
                  setAboutContent({ ...aboutContent, headline: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Đoạn dẫn nhập (Lead Paragraph)
            </label>
            <textarea
              rows={2}
              value={aboutContent.lead_paragraph}
              onChange={(e) =>
                setAboutContent({
                  ...aboutContent,
                  lead_paragraph: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Nội dung câu chuyện chi tiết
            </label>
            <textarea
              rows={4}
              value={aboutContent.story_body}
              onChange={(e) =>
                setAboutContent({ ...aboutContent, story_body: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Câu trích dẫn (Editorial Quote)
            </label>
            <input
              type="text"
              value={aboutContent.quote}
              onChange={(e) =>
                setAboutContent({ ...aboutContent, quote: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-serif italic"
            />
          </div>

          {/* About Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-[#D5C6AD]">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Hình ảnh chính
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={aboutContent.main_image_url}
                  alt="About Main"
                  className="w-20 h-16 object-cover rounded-brand border border-[#D5C6AD]"
                />
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={aboutContent.main_image_url}
                    onChange={(e) =>
                      setAboutContent({
                        ...aboutContent,
                        main_image_url: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setAboutMediaTarget('main')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#E9E6D8] rounded-brand"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Chọn ảnh
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Hình ảnh phụ
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={aboutContent.secondary_image_url}
                  alt="About Secondary"
                  className="w-20 h-16 object-cover rounded-brand border border-[#D5C6AD]"
                />
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={aboutContent.secondary_image_url}
                    onChange={(e) =>
                      setAboutContent({
                        ...aboutContent,
                        secondary_image_url: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setAboutMediaTarget('secondary')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-[#E9E6D8] rounded-brand"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Chọn ảnh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pillars */}
          <div className="pt-4 border-t border-[#D5C6AD] space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#241914]">
              3 Giá Trị Cốt Lõi (Pillars)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aboutContent.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand space-y-2.5"
                >
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) => {
                      const next = [...aboutContent.pillars];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setAboutContent({ ...aboutContent, pillars: next });
                    }}
                    className="w-full px-3 py-1.5 text-sm font-semibold bg-white border border-[#D5C6AD] rounded-brand"
                  />
                  <textarea
                    rows={3}
                    value={pillar.description}
                    onChange={(e) => {
                      const next = [...aboutContent.pillars];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setAboutContent({ ...aboutContent, pillars: next });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Header Navigation & Footer Editor */}
      {activeTab === 'navigation' && (
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#241914]">
                Các mục trên Thanh Menu (Navigation Items)
              </label>
              <button
                type="button"
                onClick={() =>
                  setNavItems([...navItems, { label: 'Mục mới', href: '#menu' }])
                }
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-[#E9E6D8] text-[#241914] rounded-brand"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mục
              </button>
            </div>

            <div className="space-y-2.5">
              {navItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...navItems];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setNavItems(next);
                    }}
                    placeholder="Nhãn hiển thị"
                    className="flex-1 px-3 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                  />
                  <input
                    type="text"
                    value={item.href}
                    onChange={(e) => {
                      const next = [...navItems];
                      next[idx] = { ...next[idx], href: e.target.value };
                      setNavItems(next);
                    }}
                    placeholder="#menu"
                    className="flex-1 px-3 py-2 text-sm font-mono bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setNavItems(navItems.filter((_, i) => i !== idx))}
                    className="p-2 text-red-700 hover:bg-red-50 rounded-brand"
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
      )}

      <MediaPickerModal
        open={Boolean(aboutMediaTarget)}
        onClose={() => setAboutMediaTarget(null)}
        onSelect={(url) => {
          if (aboutMediaTarget === 'main') {
            setAboutContent((prev) => ({ ...prev, main_image_url: url }));
          } else if (aboutMediaTarget === 'secondary') {
            setAboutContent((prev) => ({ ...prev, secondary_image_url: url }));
          }
        }}
        folder="general"
        title="Chọn ảnh cho About Section"
      />
    </div>
  );
};
