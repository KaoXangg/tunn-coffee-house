import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  ShoppingBag,
  ArrowUpRight,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteData } from '../../contexts/SiteDataContext';
import { sanitizeUrl, sanitizeMapEmbedUrl } from '../../lib/utils';
import { FacebookIcon, InstagramIcon, TikTokIcon } from '../common/SocialIcons';

export const ContactSection: React.FC = () => {
  const { settings, getSection } = useSiteData();
  const [copiedField, setCopiedField] = useState<'address' | 'hotline' | 'email' | null>(
    null
  );
  const section = getSection('contact');

  if (section && !section.is_enabled) return null;

  const handleCopy = (field: 'address' | 'hotline' | 'email', value: string) => {
    if (!value || !navigator.clipboard) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const buttonRadiusClass =
    settings.button_style === 'pill'
      ? 'rounded-full'
      : settings.button_style === 'rounded'
      ? 'rounded-xl'
      : 'rounded-brand';

  const mapEmbedSrc = sanitizeMapEmbedUrl(settings.google_maps_embed);

  return (
    <section
      id="contact"
      className="py-16 sm:py-24 lg:py-28 bg-ivory border-b border-coffee-beige/60 dark:border-b-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Top Editorial Heading */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-coffee font-semibold mb-2">
              {section?.content?.eyebrow || 'ĐỊA CHỈ & LIÊN HỆ'}
            </p>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-coffee-dark">
              {section?.title || 'Ghé Thăm TUNN Coffee House'}
            </h2>
          </div>
          <p className="text-sm sm:text-base text-coffee-muted max-w-md leading-relaxed">
            {section?.subtitle ||
              'Chúng tôi luôn sẵn sàng đón tiếp bạn với một tách trà ấm'}
          </p>
        </motion.div>

        {/* Equal-Height 2-Column Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Store Details & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex"
          >
            <div className="w-full p-6 sm:p-8 bg-ivory-light dark:bg-white/[0.03] border border-coffee-beige/70 dark:border-white/[0.08] rounded-2xl shadow-editorial flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-coffee-beige/50 dark:border-white/[0.07]">
                  <h3 className="font-serif text-2xl font-semibold text-coffee-dark">
                    {settings.store_name || settings.brand_name}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-coffee/10 text-coffee shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Mở cửa mỗi ngày</span>
                  </span>
                </div>

                <div className="space-y-4 text-sm">
                  {/* Address */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-xl bg-coffee/10 text-coffee flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-105">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-coffee-muted font-semibold">
                        Địa chỉ
                      </p>
                      <div className="flex items-start justify-between gap-2 mt-0.5">
                        <p className="text-coffee-dark leading-relaxed">
                          {settings.address
                            ? settings.address
                            : 'Đang cập nhật địa chỉ (Cập nhật tại Admin CMS → Liên hệ)'}
                        </p>
                        {settings.address && (
                          <button
                            type="button"
                            onClick={() => handleCopy('address', settings.address)}
                            className="shrink-0 p-1.5 rounded-lg text-coffee-muted hover:text-coffee hover:bg-coffee/10 transition-colors"
                            aria-label="Sao chép địa chỉ"
                            title="Sao chép địa chỉ"
                          >
                            {copiedField === 'address' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hotline */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-xl bg-coffee/10 text-coffee flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-105">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-coffee-muted font-semibold">
                        Hotline
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-coffee-dark">
                          {settings.hotline ? (
                            <a
                              href={`tel:${settings.hotline}`}
                              className="hover:text-coffee transition-colors font-medium"
                            >
                              {settings.hotline}
                            </a>
                          ) : (
                            'Đang cập nhật hotline (Cập nhật tại Admin CMS → Liên hệ)'
                          )}
                        </p>
                        {settings.hotline && (
                          <button
                            type="button"
                            onClick={() => handleCopy('hotline', settings.hotline)}
                            className="shrink-0 p-1.5 rounded-lg text-coffee-muted hover:text-coffee hover:bg-coffee/10 transition-colors"
                            aria-label="Sao chép số hotline"
                            title="Sao chép số hotline"
                          >
                            {copiedField === 'hotline' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Email (with Copy Button) */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-xl bg-coffee/10 text-coffee flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-105">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-coffee-muted font-semibold">
                        Email
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-coffee-dark min-w-0 truncate">
                          {settings.email ? (
                            <a
                              href={`mailto:${settings.email}`}
                              className="hover:text-coffee transition-colors"
                            >
                              {settings.email}
                            </a>
                          ) : (
                            'Đang cập nhật email (Cập nhật tại Admin CMS → Liên hệ)'
                          )}
                        </p>
                        {settings.email && (
                          <button
                            type="button"
                            onClick={() => handleCopy('email', settings.email)}
                            className="shrink-0 p-1.5 rounded-lg text-coffee-muted hover:text-coffee hover:bg-coffee/10 transition-colors"
                            aria-label="Sao chép email"
                            title="Sao chép email"
                          >
                            {copiedField === 'email' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Opening Hours */}
                  <div className="flex items-start gap-3.5 group">
                    <div className="w-9 h-9 rounded-xl bg-coffee/10 text-coffee flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-105">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-coffee-muted font-semibold">
                        Giờ mở cửa
                      </p>
                      <p className="text-coffee-dark mt-0.5">
                        {settings.opening_hours || '07:30 — 22:30 (Mỗi ngày)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Social Links */}
              <div className="pt-5 border-t border-coffee-beige/50 dark:border-white/[0.07] space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {settings.hotline && (
                    <a
                      href={`tel:${settings.hotline}`}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark hover:-translate-y-0.5 active:scale-[0.98] transition-all ${buttonRadiusClass}`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Gọi điện</span>
                    </a>
                  )}

                  {settings.google_maps_url && (
                    <a
                      href={sanitizeUrl(settings.google_maps_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark hover:-translate-y-0.5 active:scale-[0.98] transition-all ${buttonRadiusClass}`}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Chỉ đường</span>
                    </a>
                  )}

                  <a
                    href={sanitizeUrl(settings.order_url, '#menu')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark hover:-translate-y-0.5 active:scale-[0.98] transition-all ${buttonRadiusClass}`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Đặt món</span>
                  </a>
                </div>

                {/* Social Links */}
                {(settings.facebook_url || settings.instagram_url || settings.tiktok_url) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {settings.facebook_url && (
                      <a
                        href={sanitizeUrl(settings.facebook_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold bg-coffee/[0.07] dark:bg-white/[0.05] text-coffee hover:bg-coffee hover:text-ivory-light transition-colors"
                      >
                        <FacebookIcon className="w-3.5 h-3.5" />
                        <span>Facebook</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                    {settings.instagram_url && (
                      <a
                        href={sanitizeUrl(settings.instagram_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold bg-coffee/[0.07] dark:bg-white/[0.05] text-coffee hover:bg-coffee hover:text-ivory-light transition-colors"
                      >
                        <InstagramIcon className="w-3.5 h-3.5" />
                        <span>Instagram</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                    {settings.tiktok_url && (
                      <a
                        href={sanitizeUrl(settings.tiktok_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-semibold bg-coffee/[0.07] dark:bg-white/[0.05] text-coffee hover:bg-coffee hover:text-ivory-light transition-colors"
                      >
                        <TikTokIcon className="w-3.5 h-3.5" />
                        <span>TikTok</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Equal-Height Interactive Google Maps Card */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 flex"
          >
            <div className="w-full min-h-[340px] sm:min-h-[420px] lg:min-h-0 h-full rounded-2xl overflow-hidden border border-coffee-beige/70 dark:border-white/[0.08] bg-ivory-light dark:bg-white/[0.03] shadow-editorial relative group">
              {mapEmbedSrc ? (
                <>
                  <iframe
                    src={mapEmbedSrc}
                    title="Bản đồ TUNN Coffee House"
                    className="w-full h-full min-h-[340px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  {settings.google_maps_url && (
                    <a
                      href={sanitizeUrl(settings.google_maps_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold backdrop-blur-md bg-[#140F0C]/80 text-[#F7F5EF] border border-white/15 hover:bg-coffee transition-all shadow-lg"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>Mở Google Maps</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  )}
                </>
              ) : (
                <div className="w-full h-full min-h-[340px] relative flex flex-col items-center justify-center p-8 text-center">
                  <img
                    src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80"
                    alt="Không gian TUNN Coffee House"
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="relative z-10 max-w-md bg-ivory-light/95 backdrop-blur-sm p-6 border border-coffee-beige/70 dark:border-white/[0.1] rounded-2xl">
                    <MapPin className="w-7 h-7 text-coffee mx-auto mb-2 stroke-1" />
                    <p className="font-serif text-xl font-semibold text-coffee-dark">
                      Không Gian Thưởng Trà &amp; Cà Phê
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
