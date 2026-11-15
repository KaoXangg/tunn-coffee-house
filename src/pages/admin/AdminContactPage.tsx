import React, { useState, useEffect } from 'react';
import { Save, Loader2, MapPin, Phone, Mail, Clock, Share2 } from 'lucide-react';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';

export const AdminContactPage: React.FC = () => {
  const { settings, updateSiteSettings } = useSiteData();
  const toast = useToast();

  const [storeName, setStoreName] = useState(settings.store_name);
  const [address, setAddress] = useState(settings.address);
  const [hotline, setHotline] = useState(settings.hotline);
  const [email, setEmail] = useState(settings.email);
  const [openingHours, setOpeningHours] = useState(settings.opening_hours);
  const [googleMapsUrl, setGoogleMapsUrl] = useState(settings.google_maps_url);
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState(settings.google_maps_embed);
  const [facebookUrl, setFacebookUrl] = useState(settings.facebook_url);
  const [instagramUrl, setInstagramUrl] = useState(settings.instagram_url);
  const [tiktokUrl, setTiktokUrl] = useState(settings.tiktok_url);
  const [orderUrl, setOrderUrl] = useState(settings.order_url);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStoreName(settings.store_name);
    setAddress(settings.address);
    setHotline(settings.hotline);
    setEmail(settings.email);
    setOpeningHours(settings.opening_hours);
    setGoogleMapsUrl(settings.google_maps_url);
    setGoogleMapsEmbed(settings.google_maps_embed);
    setFacebookUrl(settings.facebook_url);
    setInstagramUrl(settings.instagram_url);
    setTiktokUrl(settings.tiktok_url);
    setOrderUrl(settings.order_url);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await updateSiteSettings({
        store_name: storeName.trim(),
        address: address.trim(),
        hotline: hotline.trim(),
        email: email.trim(),
        opening_hours: openingHours.trim(),
        google_maps_url: googleMapsUrl.trim(),
        google_maps_embed: googleMapsEmbed.trim(),
        facebook_url: facebookUrl.trim(),
        instagram_url: instagramUrl.trim(),
        tiktok_url: tiktokUrl.trim(),
        order_url: orderUrl.trim() || '#menu',
      });

      if (error) {
        toast.info('Đã cập nhật tạm thời', error);
      } else {
        toast.success(
          'Đã lưu Thông tin Liên hệ!',
          'Mọi thông tin địa chỉ, hotline và mạng xã hội đã đồng bộ với trang khách hàng.'
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Cài Đặt Thông Tin Liên Hệ & Cửa Hàng
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Quản lý địa chỉ thực tế, hotline, giờ mở cửa, Google Maps và mạng xã hội chính thức của TUNN Coffee House.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Lưu Thông Tin Liên Hệ</span>
        </button>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        <div className="lg:col-span-7 bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-5">
          <h2 className="font-serif text-xl font-semibold text-[#241914] pb-3 border-b border-[#D5C6AD]">
            Thông Tin Quán
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Tên cửa hàng hiển thị
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                <Clock className="w-3.5 h-3.5 inline mr-1" /> Giờ mở cửa
              </label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="07:30 — 22:30 (Mỗi ngày)"
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" /> Địa chỉ chính thức của quán
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ thực tế của TUNN Coffee House..."
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                <Phone className="w-3.5 h-3.5 inline mr-1" /> Số điện thoại Hotline
              </label>
              <input
                type="tel"
                value={hotline}
                onChange={(e) => setHotline(e.target.value)}
                placeholder="Nhập số điện thoại liên hệ..."
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" /> Địa chỉ Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@tunncoffee.com"
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#D5C6AD] space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Link chỉ đường Google Maps (Mở ứng dụng bản đồ)
              </label>
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Link Iframe Google Maps Embed (src=&quot;https://www.google.com/maps/embed?...&quot;)
              </label>
              <input
                type="text"
                value={googleMapsEmbed}
                onChange={(e) => setGoogleMapsEmbed(e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="lg:col-span-5 bg-white border border-[#D5C6AD] rounded-brand p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#D5C6AD]">
            <Share2 className="w-4 h-4 text-[#4B2E24]" />
            <h2 className="font-serif text-xl font-semibold text-[#241914]">
              Mạng Xã Hội & Kênh Đặt Món
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Facebook Fanpage URL
            </label>
            <input
              type="url"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://facebook.com/tunncoffeehouse"
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Instagram URL
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://instagram.com/tunncoffeehouse"
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              TikTok URL
            </label>
            <input
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="https://tiktok.com/@tunncoffeehouse"
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
              Đường dẫn nút &ldquo;Đặt Món&rdquo; (Zalo / Messenger / #menu)
            </label>
            <input
              type="text"
              value={orderUrl}
              onChange={(e) => setOrderUrl(e.target.value)}
              placeholder="#menu"
              className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
            />
          </div>
        </div>
      </form>
    </div>
  );
};
