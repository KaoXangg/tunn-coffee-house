import React from 'react';
import { Image as ImageIcon, Loader2, Save } from 'lucide-react';
import type { AboutSectionContent } from '../../../types/database';

interface AboutTabProps {
  aboutContent: AboutSectionContent;
  savingAbout: boolean;
  onChangeContent: React.Dispatch<React.SetStateAction<AboutSectionContent>>;
  onOpenMediaPicker: (target: 'main' | 'secondary') => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({
  aboutContent,
  savingAbout,
  onChangeContent: setAboutContent,
  onOpenMediaPicker: setAboutMediaTarget,
  onSubmit: handleSaveAbout,
}) => {
  return (
        <form
          onSubmit={handleSaveAbout}
          className="bg-white border border-coffee-beige rounded-brand p-6 space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-coffee-beige">
            <div>
              <h2 className="font-serif text-xl font-semibold text-coffee-dark">
                Chỉnh Sửa Câu Chuyện Thương Hiệu (About Section)
              </h2>
              <p className="text-xs text-coffee-muted">
                Quản lý triết lý thương hiệu, câu chuyện nguyên liệu, quy trình pha chế và 3 trụ cột giá trị.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingAbout}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light rounded-brand"
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Nhãn Eyebrow
              </label>
              <input
                type="text"
                value={aboutContent.eyebrow}
                onChange={(e) =>
                  setAboutContent({ ...aboutContent, eyebrow: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Tiêu đề nghệ thuật (Headline)
              </label>
              <input
                type="text"
                value={aboutContent.headline}
                onChange={(e) =>
                  setAboutContent({ ...aboutContent, headline: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
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
              className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
              Nội dung câu chuyện chi tiết
            </label>
            <textarea
              rows={4}
              value={aboutContent.story_body}
              onChange={(e) =>
                setAboutContent({ ...aboutContent, story_body: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
              Câu trích dẫn (Editorial Quote)
            </label>
            <input
              type="text"
              value={aboutContent.quote}
              onChange={(e) =>
                setAboutContent({ ...aboutContent, quote: e.target.value })
              }
              className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand font-serif italic"
            />
          </div>

          {/* About Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-coffee-beige">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Hình ảnh chính
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={aboutContent.main_image_url}
                  alt="About Main"
                  className="w-20 h-16 object-cover rounded-brand border border-coffee-beige"
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
                    className="w-full px-3 py-1.5 text-xs bg-ivory-light border border-coffee-beige rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setAboutMediaTarget('main')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-ivory rounded-brand"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Chọn ảnh
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Hình ảnh phụ
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={aboutContent.secondary_image_url}
                  alt="About Secondary"
                  className="w-20 h-16 object-cover rounded-brand border border-coffee-beige"
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
                    className="w-full px-3 py-1.5 text-xs bg-ivory-light border border-coffee-beige rounded-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setAboutMediaTarget('secondary')}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-ivory rounded-brand"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Chọn ảnh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Pillars */}
          <div className="pt-4 border-t border-coffee-beige space-y-4">
            <h3 className="font-serif text-lg font-semibold text-coffee-dark">
              3 Giá Trị Cốt Lõi (Pillars)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aboutContent.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-ivory-light border border-coffee-beige rounded-brand space-y-2.5"
                >
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) => {
                      const next = [...aboutContent.pillars];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setAboutContent({ ...aboutContent, pillars: next });
                    }}
                    className="w-full px-3 py-1.5 text-sm font-semibold bg-white border border-coffee-beige rounded-brand"
                  />
                  <textarea
                    rows={3}
                    value={pillar.description}
                    onChange={(e) => {
                      const next = [...aboutContent.pillars];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setAboutContent({ ...aboutContent, pillars: next });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-coffee-beige rounded-brand"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>
  );
};
