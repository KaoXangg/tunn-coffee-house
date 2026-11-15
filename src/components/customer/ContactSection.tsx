import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';

export const ContactSection: React.FC = () => {
  const { settings, getSection } = useSiteData();
  const section = getSection('contact');

  if (section && !section.is_enabled) return null;

  const buttonRadiusClass =
    settings.button_style === 'pill'
      ? 'rounded-full'
      : settings.button_style === 'rounded'
      ? 'rounded-lg'
      : 'rounded-brand';

  return (
    <section
      id="contact"
      className="py-20 sm:py-28 bg-ivory border-b border-coffee-beige/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Store Details & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] text-coffee font-semibold mb-2.5">
                <span className="font-serif italic normal-case text-xs">Chương VI</span>
                <span className="w-3.5 h-[1px] bg-coffee/40" />
                <span>{section?.content?.eyebrow || 'ĐỊA CHỈ & LIÊN HỆ'}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
                {section?.title || 'Ghé Thăm TUNN Coffee House'}
              </h2>
              <p className="text-sm sm:text-base text-coffee-muted mt-3 leading-relaxed">
                {section?.subtitle ||
                  'Chúng tôi luôn sẵn sàng đón tiếp bạn với một tách trà ấm'}
              </p>
            </div>

            {/* Info Card */}
            <div className="p-6 sm:p-8 bg-ivory-light border border-coffee-beige rounded-brand space-y-5">
              <h3 className="font-serif text-2xl font-semibold text-coffee-dark border-b border-coffee-beige/60 pb-3">
                {settings.store_name || settings.brand_name}
              </h3>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-4 h-4 text-coffee shrink-0 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-coffee-muted font-semibold">
                      Địa chỉ
                    </p>
                    <p className="text-coffee-dark mt-0.5">
                      {settings.address
                        ? settings.address
                        : 'Đang cập nhật địa chỉ (Cập nhật tại Admin CMS → Liên hệ)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="w-4 h-4 text-coffee shrink-0 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-coffee-muted font-semibold">
                      Hotline
                    </p>
                    <p className="text-coffee-dark mt-0.5">
                      {settings.hotline ? (
                        <a
                          href={`tel:${settings.hotline}`}
                          className="hover:text-coffee underline underline-offset-4"
                        >
                          {settings.hotline}
                        </a>
                      ) : (
                        'Đang cập nhật hotline (Cập nhật tại Admin CMS → Liên hệ)'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="w-4 h-4 text-coffee shrink-0 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-coffee-muted font-semibold">
                      Email
                    </p>
                    <p className="text-coffee-dark mt-0.5">
                      {settings.email ? (
                        <a
                          href={`mailto:${settings.email}`}
                          className="hover:text-coffee underline underline-offset-4"
                        >
                          {settings.email}
                        </a>
                      ) : (
                        'Đang cập nhật email (Cập nhật tại Admin CMS → Liên hệ)'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Clock className="w-4 h-4 text-coffee shrink-0 mt-1" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-coffee-muted font-semibold">
                      Giờ mở cửa
                    </p>
                    <p className="text-coffee-dark mt-0.5">
                      {settings.opening_hours || '07:30 — 22:30 (Mỗi ngày)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-coffee-beige/60 flex flex-wrap gap-3">
                {settings.hotline && (
                  <a
                    href={`tel:${settings.hotline}`}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-colors ${buttonRadiusClass}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi điện</span>
                  </a>
                )}

                {settings.google_maps_url && (
                  <a
                    href={settings.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider font-semibold border border-coffee text-coffee-dark hover:bg-ivory transition-colors ${buttonRadiusClass}`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Chỉ đường</span>
                  </a>
                )}

                <a
                  href={settings.order_url || '#menu'}
                  className={`inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark transition-colors ${buttonRadiusClass}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Đặt món</span>
                </a>
              </div>

              {/* Social Links */}
              <div className="pt-3 flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest font-semibold text-coffee">
                {settings.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-coffee-dark"
                  >
                    <span>Facebook</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {settings.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-coffee-dark"
                  >
                    <span>Instagram</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
                {settings.tiktok_url && (
                  <a
                    href={settings.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-coffee-dark"
                  >
                    <span>TikTok</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Google Maps Embed or Visual Space Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6"
          >
            <div className="aspect-[4/3] w-full rounded-brand overflow-hidden border border-coffee-beige bg-ivory-light shadow-sm relative">
              {settings.google_maps_embed ? (
                <iframe
                  src={settings.google_maps_embed}
                  title="Bản đồ TUNN Coffee House"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="w-full h-full relative flex flex-col items-center justify-center p-8 text-center">
                  <img
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80"
                    alt="Không gian TUNN Coffee House"
                    className="absolute inset-0 w-full h-full object-cover opacity-25"
                    loading="lazy"
                  />
                  <div className="relative z-10 max-w-md bg-ivory-light/95 backdrop-blur-sm p-6 border border-coffee-beige rounded-brand">
                    <MapPin className="w-7 h-7 text-coffee mx-auto mb-2 stroke-1" />
                    <p className="font-serif text-xl font-semibold text-coffee-dark">
                      Không Gian Thưởng Trà & Cà Phê
                    </p>
                    <p className="text-xs text-coffee-muted mt-1.5 leading-relaxed">
                      Quản trị viên có thể gắn đường dẫn Google Maps hoặc mã nhúng bản đồ trực tiếp tại trang Admin CMS → Cài đặt Liên hệ.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
