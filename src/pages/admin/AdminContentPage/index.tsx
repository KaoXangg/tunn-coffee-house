import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { broadcastLiveSync } from '../../../lib/liveSync';
import { useSiteData } from '../../../contexts/SiteDataContext';
import { useToast } from '../../../contexts/ToastContext';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_SITE_SETTINGS } from '../../../lib/defaultData';
import { MediaPickerModal } from '../../../components/common/MediaPickerModal';
import { SectionsTab } from './SectionsTab';
import { AboutTab } from './AboutTab';
import { NavigationTab } from './NavigationTab';
import type { AboutSectionContent, PageSection } from '../../../types/database';

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
  const [deletedNavItems, setDeletedNavItems] = useState<
    Array<{ label: string; href: string; originalIndex: number }>
  >([]);
  const [headerCtaLabel, setHeaderCtaLabel] = useState(settings.header_cta_label);
  const [headerCtaHref, setHeaderCtaHref] = useState(settings.header_cta_href);
  const [footerDesc, setFooterDesc] = useState(settings.footer_description);
  const [copyright, setCopyright] = useState(settings.copyright_text);
  const [savingNav, setSavingNav] = useState(false);
  const [navDirty, setNavDirty] = useState(false);

  const [prevSections, setPrevSections] = useState(sections);
  if (sections !== prevSections) {
    setPrevSections(sections);
    setOrderedSections([...sections].sort((a, b) => a.sort_order - b.sort_order));
  }

  const [prevAboutSec, setPrevAboutSec] = useState(aboutSec);
  if (aboutSec && aboutSec !== prevAboutSec) {
    setPrevAboutSec(aboutSec);
    setAboutTitle(aboutSec.title);
    setAboutSubtitle(aboutSec.subtitle);
    setAboutContent({
      ...DEFAULT_ABOUT_CONTENT,
      ...(aboutSec.content || {}),
      pillars: Array.isArray(aboutSec.content?.pillars)
        ? (aboutSec.content.pillars as AboutSectionContent['pillars'])
        : DEFAULT_ABOUT_CONTENT.pillars,
    });
  }

  const [prevSettings, setPrevSettings] = useState(settings);
  if (settings !== prevSettings) {
    setPrevSettings(settings);
    if (!navDirty) {
      setNavItems(settings.nav_items || []);
      setHeaderCtaLabel(settings.header_cta_label);
      setHeaderCtaHref(settings.header_cta_href);
      setFooterDesc(settings.footer_description);
      setCopyright(settings.copyright_text);
    }
  }

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

  const moveNavItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= navItems.length) return;
    const clone = [...navItems];
    const temp = clone[index];
    clone[index] = clone[targetIndex];
    clone[targetIndex] = temp;
    setNavItems(clone);
    setNavDirty(true);
  };

  const handleAddNavItem = () => {
    setNavItems((prev) => [...prev, { label: 'Mục mới', href: '#hero' }]);
    setNavDirty(true);
  };

  const handleDeleteNavItem = (idx: number) => {
    const removed = navItems[idx];
    if (!removed) return;
    setNavItems(navItems.filter((_, i) => i !== idx));
    setNavDirty(true);
    setDeletedNavItems((prev) => [
      { label: removed.label, href: removed.href, originalIndex: idx },
      ...prev.filter(
        (d) => !(d.label === removed.label && d.href === removed.href)
      ),
    ]);
  };

  const restorableNavItems = [
    ...deletedNavItems,
    ...DEFAULT_SITE_SETTINGS.nav_items
      .map((def, idx) => ({ ...def, originalIndex: idx }))
      .filter(
        (def) =>
          !navItems.some(
            (n) =>
              n.href.trim().toLowerCase() === def.href.trim().toLowerCase() ||
              n.label.trim().toLowerCase() === def.label.trim().toLowerCase()
          ) &&
          !deletedNavItems.some(
            (d) =>
              d.href.trim().toLowerCase() === def.href.trim().toLowerCase() &&
              d.label.trim().toLowerCase() === def.label.trim().toLowerCase()
          )
      ),
  ];

  const handleRestoreSingleNavItem = (target: {
    label: string;
    href: string;
    originalIndex: number;
  }) => {
    const insertAt = Math.min(Math.max(0, target.originalIndex), navItems.length);
    const next = [...navItems];
    next.splice(insertAt, 0, { label: target.label, href: target.href });
    setNavItems(next);
    setNavDirty(true);
    setDeletedNavItems((prev) =>
      prev.filter(
        (d) => !(d.label === target.label && d.href === target.href)
      )
    );
    toast.info(
      `Đã khôi phục mục "${target.label || target.href}"`,
      'Nhấn "Lưu Navigation & Footer" để áp dụng ra trang chủ.'
    );
  };

  const handleRestoreDefaultNav = () => {
    setNavItems([...DEFAULT_SITE_SETTINGS.nav_items]);
    setDeletedNavItems([]);
    setNavDirty(true);
    toast.info('Đã khôi phục danh sách menu mặc định', 'Nhấn "Lưu Navigation & Footer" để áp dụng.');
  };

  const toggleSectionVisibility = (key: PageSection['section_key']) => {
    setOrderedSections((prev) =>
      prev.map((sec) =>
        sec.section_key === key ? { ...sec, is_enabled: !sec.is_enabled } : sec
      )
    );
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
        if (key === 'about') {
          const contentField = field === 'title' ? 'headline' : 'lead_paragraph';
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

  const updateSectionContentValue = (
    key: PageSection['section_key'],
    field: string,
    value: string
  ) => {
    setOrderedSections((prev) =>
      prev.map((sec) =>
        sec.section_key === key
          ? { ...sec, content: { ...(sec.content || {}), [field]: value } }
          : sec
      )
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
      if (isSupabaseConfigured) {
        const payload = orderedSections.map((sec) => ({
          section_key: sec.section_key,
          title: sec.title,
          subtitle: sec.subtitle,
          is_enabled: sec.is_enabled,
          sort_order: sec.sort_order,
          content: sec.content,
        }));
        const { error } = await supabase
          .from('page_sections')
          .upsert(payload, { onConflict: 'section_key' });
        if (error) throw error;
      } else {
        await Promise.all(
          orderedSections.map((sec) =>
            updatePageSection(sec.section_key, {
              title: sec.title,
              subtitle: sec.subtitle,
              is_enabled: sec.is_enabled,
              sort_order: sec.sort_order,
              content: sec.content,
            })
          )
        );
      }
      broadcastLiveSync('cms');
      await refreshAll();
      toast.success(
        'Đã lưu cấu trúc & thứ tự các Section!',
        'Trang chủ khách hàng đã được cập nhật.'
      );
    } catch (err: unknown) {
      toast.error('Lỗi lưu thứ tự section', err instanceof Error ? err.message : undefined);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAbout(true);
    try {
      const { error } = await updatePageSection('about', {
        title: aboutContent.headline || aboutTitle,
        subtitle: aboutContent.lead_paragraph || aboutSubtitle,
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
    const cleanedNavItems = navItems
      .map((item) => ({
        label: item.label.trim(),
        href: item.href.trim() || '#hero',
      }))
      .filter((item) => item.label.length > 0);

    setSavingNav(true);
    try {
      const { error } = await updateSiteSettings({
        nav_items: cleanedNavItems,
        header_cta_label: headerCtaLabel.trim(),
        header_cta_href: headerCtaHref.trim(),
        footer_description: footerDesc,
        copyright_text: copyright,
      });
      setNavItems(cleanedNavItems);
      setNavDirty(false);
      broadcastLiveSync('cms');
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

      {activeTab === 'sections' && (
        <SectionsTab
          orderedSections={orderedSections}
          savingOrder={savingOrder}
          onSaveOrder={handleSaveSectionsOrder}
          onMoveSection={moveSection}
          onToggleVisibility={toggleSectionVisibility}
          onUpdateHeaderField={updateSectionHeaderField}
          onUpdateContentValue={updateSectionContentValue}
          onUpdateEyebrow={updateSectionEyebrow}
          onSwitchToAbout={() => setActiveTab('about')}
        />
      )}

      {activeTab === 'about' && (
        <AboutTab
          aboutContent={aboutContent}
          savingAbout={savingAbout}
          onChangeContent={setAboutContent}
          onOpenMediaPicker={setAboutMediaTarget}
          onSubmit={handleSaveAbout}
        />
      )}

      {activeTab === 'navigation' && (
        <NavigationTab
          navItems={navItems}
          restorableNavItems={restorableNavItems}
          headerCtaLabel={headerCtaLabel}
          headerCtaHref={headerCtaHref}
          footerDesc={footerDesc}
          copyright={copyright}
          savingNav={savingNav}
          onChangeNavItems={setNavItems}
          onMarkDirty={() => setNavDirty(true)}
          onMoveNavItem={moveNavItem}
          onAddNavItem={handleAddNavItem}
          onDeleteNavItem={handleDeleteNavItem}
          onRestoreSingleNavItem={handleRestoreSingleNavItem}
          onRestoreDefaultNav={handleRestoreDefaultNav}
          onChangeHeaderCtaLabel={setHeaderCtaLabel}
          onChangeHeaderCtaHref={setHeaderCtaHref}
          onChangeFooterDesc={setFooterDesc}
          onChangeCopyright={setCopyright}
          onSubmit={handleSaveNavigationAndFooter}
        />
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
