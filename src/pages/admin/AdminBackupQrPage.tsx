import React, { useState, useRef, useMemo } from 'react';
import {
  Download,
  Upload,
  QrCode,
  Copy,
  Check,
  Loader2,
  Database,
  Printer,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { renderQrToDataUrl } from '../../lib/qrGenerator';

export const AdminBackupQrPage: React.FC = () => {
  const {
    settings,
    categories,
    products,
    promotions,
    gallery,
    sections,
    refreshAll,
    logAdminActivity,
  } = useSiteData();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Backup & Restore state
  const [restoring, setRestoring] = useState(false);
  interface BackupPayload {
    exported_at?: string;
    data: {
      site_settings?: Record<string, unknown>;
      categories?: unknown[];
      products?: Array<Record<string, unknown>>;
      promotions?: unknown[];
      gallery_items?: unknown[];
      page_sections?: unknown[];
    };
  }
  const [pendingBackupData, setPendingBackupData] = useState<BackupPayload | null>(null);

  // QR Code Generator state
  const defaultOrigin =
    typeof window !== 'undefined' && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://tunn-coffee-house.vercel.app';

  const [qrTargetUrl, setQrTargetUrl] = useState(`${defaultOrigin}/#menu`);
  const [qrTitle, setQrTitle] = useState('QUÉT MÃ XEM THỰC ĐƠN');
  const [qrSubtitle, setQrSubtitle] = useState('TUNN Coffee House — Your Daily Ritual');
  const [tableNumber, setTableNumber] = useState('');
  const [downloadingQr, setDownloadingQr] = useState(false);

  // 1. Export full website JSON backup
  const handleDownloadBackup = () => {
    const backupPayload = {
      version: '1.0.0',
      brand: 'TUNN Coffee House',
      exported_at: new Date().toISOString(),
      data: {
        site_settings: settings,
        categories,
        products: products.map((p) => {
          const rest = { ...p };
          delete rest.categories;
          return rest;
        }),
        promotions,
        gallery_items: gallery,
        page_sections: sections,
      },
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tunn-coffee-house-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logAdminActivity('Tải xuống bản sao lưu Website (.json)', 'backup');
    toast.success(
      'Đã tải xuống file Sao lưu!',
      `File tunn-coffee-house-backup-${dateStr}.json đã được lưu về máy.`
    );
  };

  // 2. Read uploaded JSON backup file
  const handleSelectBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed?.data || !parsed?.data?.site_settings) {
        toast.error(
          'File sao lưu không hợp lệ',
          'Vui lòng chọn đúng file .json được xuất từ hệ thống TUNN Coffee House.'
        );
        return;
      }

      setPendingBackupData(parsed);
    } catch {
      toast.error('Không thể đọc file JSON', 'File bị hỏng hoặc sai định dạng.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. Execute 1-Click Restore to Supabase
  const handleConfirmRestore = async () => {
    if (!pendingBackupData || !isSupabaseConfigured) {
      setPendingBackupData(null);
      return;
    }

    setRestoring(true);
    try {
      const {
        site_settings: bSettings,
        categories: bCategories,
        products: bProducts,
        promotions: bPromotions,
        gallery_items: bGallery,
        page_sections: bSections,
      } = pendingBackupData.data;

      if (bSettings) {
        await supabase.from('site_settings').upsert({ ...bSettings, id: 1 });
      }

      if (Array.isArray(bCategories) && bCategories.length > 0) {
        await supabase.from('categories').upsert(bCategories);
      }

      if (Array.isArray(bProducts) && bProducts.length > 0) {
        const cleanProducts = bProducts.map((p) => {
          const rest = { ...p };
          delete rest.categories;
          return rest;
        });
        await supabase.from('products').upsert(cleanProducts);
      }

      if (Array.isArray(bPromotions) && bPromotions.length > 0) {
        await supabase.from('promotions').upsert(bPromotions);
      }

      if (Array.isArray(bGallery) && bGallery.length > 0) {
        await supabase.from('gallery_items').upsert(bGallery);
      }

      if (Array.isArray(bSections) && bSections.length > 0) {
        await supabase
          .from('page_sections')
          .upsert(bSections, { onConflict: 'section_key' });
      }

      await logAdminActivity(
        'Khôi phục toàn bộ dữ liệu từ file Backup',
        'backup',
        pendingBackupData.exported_at
      );
      await refreshAll();
      toast.success(
        'Khôi phục dữ liệu hoàn tất!',
        'Toàn bộ Thực đơn, Danh mục và Cài đặt đã được khôi phục nguyên trạng.'
      );
      setPendingBackupData(null);
    } catch (err: unknown) {
      toast.error('Lỗi khi khôi phục dữ liệu', err instanceof Error ? err.message : undefined);
    } finally {
      setRestoring(false);
    }
  };

  // Build high-res QR Code Data URL locally (coffee brown #4B2E24 on cream #F7F5EF)
  const finalQrDestination = useMemo(() => {
    const cleanTarget = qrTargetUrl.trim() || 'https://tunn-coffee-house.vercel.app/#menu';
    if (!tableNumber.trim()) return cleanTarget;

    const encodedTable = encodeURIComponent(tableNumber.trim());
    if (cleanTarget.includes('#')) {
      const [basePart, hashPart] = cleanTarget.split('#');
      const sep = basePart.includes('?') ? '&' : '?';
      return `${basePart}${sep}table=${encodedTable}#${hashPart}`;
    }
    const sep = cleanTarget.includes('?') ? '&' : '?';
    return `${cleanTarget}${sep}table=${encodedTable}`;
  }, [qrTargetUrl, tableNumber]);

  const qrDataUrl = useMemo(() => {
    return renderQrToDataUrl(finalQrDestination, {
      pixelSize: 600,
      marginModules: 3,
      darkColor: '#4B2E24',
      lightColor: '#F7F5EF',
    });
  }, [finalQrDestination]);

  const handleDownloadRawQrOnly = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `TUNN-QR-Code${tableNumber.trim() ? `-Ban-${tableNumber.trim()}` : ''}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Đã tải hình mã QR thành công!');
  };

  // Download printable Table Standee Card as high-res PNG using HTML5 Canvas
  const handleDownloadPrintableCard = async () => {
    setDownloadingQr(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background Warm Ivory
      ctx.fillStyle = '#E9E6D8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Inner Cream Card
      ctx.fillStyle = '#F7F5EF';
      ctx.fillRect(50, 50, 800, 1100);

      // Double Editorial Border
      ctx.strokeStyle = '#4B2E24';
      ctx.lineWidth = 3;
      ctx.strokeRect(70, 70, 760, 1060);

      // Brand Header Text
      ctx.fillStyle = '#241914';
      ctx.font = 'bold 48px Lora, "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText(settings.brand_name || 'TUNN Coffee House', 450, 175);

      ctx.fillStyle = '#8C7565';
      ctx.font = '20px "Be Vietnam Pro", sans-serif';
      ctx.fillText(qrSubtitle || 'Your Daily Ritual, Made Extraordinary', 450, 220);

      if (tableNumber.trim()) {
        ctx.fillStyle = '#4B2E24';
        ctx.font = 'bold 28px "Be Vietnam Pro", sans-serif';
        ctx.fillText(`BÀN SỐ: ${tableNumber.trim().toUpperCase()}`, 450, 275);
      }

      // Draw Locally Generated QR Image
      const qrImg = new Image();
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      ctx.drawImage(qrImg, 200, 310, 500, 500);

      // Border around QR
      ctx.strokeStyle = '#D5C6AD';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 310, 500, 500);

      // Bottom Call to Action
      ctx.fillStyle = '#4B2E24';
      ctx.font = 'bold 34px Lora, "Playfair Display", serif';
      ctx.fillText(qrTitle || 'QUÉT MÃ XEM THỰC ĐƠN', 450, 900);

      ctx.fillStyle = '#8C7565';
      ctx.font = '20px "Be Vietnam Pro", sans-serif';
      ctx.fillText('Sử dụng Camera điện thoại hoặc Zalo để quét mã', 450, 950);

      ctx.fillStyle = '#241914';
      ctx.font = '18px monospace';
      ctx.fillText(qrTargetUrl.replace(/^https?:\/\//, ''), 450, 1045);

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `TUNN-QR-Menu${tableNumber ? `-Ban-${tableNumber}` : ''}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(
        'Đã tải thẻ QR Menu nét cao!',
        'Bạn có thể mang file ảnh PNG này đi in dán tại bàn hoặc quầy thu ngân.'
      );
    } catch (err: unknown) {
      toast.error('Không thể xuất ảnh thẻ QR', err instanceof Error ? err.message : undefined);
    } finally {
      setDownloadingQr(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#241914]">
          Sao Lưu Dữ Liệu 1-Click & Tạo Mã QR Menu Đặt Bàn
        </h1>
        <p className="text-sm text-[#8C7565] mt-1">
          Bảo vệ an toàn tuyệt đối dữ liệu của quán và tạo thẻ QR Thực đơn chuẩn màu thương hiệu để in dán tại bàn.
        </p>
      </div>

      {/* SECTION 1: 1-CLICK BACKUP & RESTORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E9E6D8] text-[#4B2E24] rounded-brand text-xs font-semibold uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" />
              <span>Sao Lưu Toàn Bộ (Export Backup)</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#241914]">
              Tải Xuống Bản Sao Lưu Website (.json)
            </h2>
            <p className="text-xs sm:text-sm text-[#8C7565] leading-relaxed">
              Chỉ với 1 cú nhấp chuột, toàn bộ dữ liệu hiện tại của quán sẽ được đóng gói thành 1 file duy nhất để bạn cất giữ an toàn trong máy tính hoặc Google Drive:
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-[#241914] pt-1">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>{products.length} Món trong Thực đơn</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>{categories.length} Danh mục đồ uống</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>{promotions.length} Chương trình ưu đãi</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span>{gallery.length} Ảnh Gallery & Cài đặt</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="w-full py-3 px-5 bg-[#4B2E24] hover:bg-[#241914] text-[#F7F5EF] text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải Xuống Bản Sao Lưu Ngay (.JSON)</span>
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-brand text-xs font-semibold uppercase tracking-wider">
              <Upload className="w-3.5 h-3.5" />
              <span>Khôi Phục Dữ Liệu (1-Click Restore)</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-[#241914]">
              Khôi Phục Từ File Sao Lưu Đã Lưu
            </h2>
            <p className="text-xs sm:text-sm text-[#8C7565] leading-relaxed">
              Nếu bạn lỡ tay xóa nhầm món hoặc chỉnh sửa sai nội dung, chỉ cần chọn lại file <code className="font-mono bg-[#F7F5EF] px-1 rounded">.json</code> đã tải về trước đó. Hệ thống sẽ đồng bộ toàn bộ dữ liệu quay về nguyên trạng trong 3 giây.
            </p>
            <div className="p-3 bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand text-xs text-[#8C7565] flex items-start gap-2">
              <Database className="w-4 h-4 text-[#4B2E24] shrink-0 mt-0.5" />
              <span>
                Hệ thống sẽ yêu cầu bạn xác nhận trước khi ghi đè dữ liệu lên Supabase PostgreSQL.
              </span>
            </div>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleSelectBackupFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-5 border-2 border-[#4B2E24] text-[#4B2E24] hover:bg-[#E9E6D8] text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn File Backup (.JSON) Để Khôi Phục</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: QR CODE MENU STANDEE GENERATOR */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#D5C6AD] mb-6">
          <QrCode className="w-6 h-6 text-[#4B2E24]" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#241914]">
              Bộ Tạo Mã QR Menu Đặt Bàn & Ấn Phẩm In Ấn
            </h2>
            <p className="text-xs text-[#8C7565]">
              Tạo thẻ QR mang sắc nâu cà phê & kem ngà đồng bộ thương hiệu để in dán lên bàn, quầy thu ngân hoặc ly mang đi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* QR Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Đường dẫn khi khách quét mã QR
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={qrTargetUrl}
                  onChange={(e) => setQrTargetUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(finalQrDestination);
                    toast.success('Đã sao chép đường dẫn Menu!');
                  }}
                  className="px-3.5 py-2 bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setQrTargetUrl('https://tunn-coffee-house.vercel.app/#menu')
                  }
                  className="text-[11px] px-2.5 py-1 bg-[#F7F5EF] border border-[#D5C6AD] rounded hover:bg-[#E9E6D8]"
                >
                  Mở thẳng Thực đơn (#menu)
                </button>
                <button
                  type="button"
                  onClick={() => setQrTargetUrl('https://tunn-coffee-house.vercel.app')}
                  className="text-[11px] px-2.5 py-1 bg-[#F7F5EF] border border-[#D5C6AD] rounded hover:bg-[#E9E6D8]"
                >
                  Mở Trang chủ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQrTargetUrl('https://tunn-coffee-house.vercel.app/#promotions')
                  }
                  className="text-[11px] px-2.5 py-1 bg-[#F7F5EF] border border-[#D5C6AD] rounded hover:bg-[#E9E6D8]"
                >
                  Mở khu vực Ưu đãi (#promotions)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Tiêu đề in trên Thẻ QR
                </label>
                <input
                  type="text"
                  value={qrTitle}
                  onChange={(e) => setQrTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Số bàn (Tùy chọn - Để trống nếu dùng chung)
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="VD: 01, 02, VIP..."
                  className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                Dòng phụ đề thương hiệu
              </label>
              <input
                type="text"
                value={qrSubtitle}
                onChange={(e) => setQrSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
              />
            </div>

            <div className="pt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={downloadingQr}
                onClick={handleDownloadPrintableCard}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors"
              >
                {downloadingQr ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>Tải Thẻ Standee QR Nét Cao (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadRawQrOnly}
                className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] text-[#241914] hover:bg-[#E9E6D8] rounded-brand"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Chỉ tải riêng hình QR</span>
              </button>
            </div>
          </div>

          {/* Live Standee Card Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-72 bg-[#E9E6D8] p-4 rounded-brand border border-[#D5C6AD] shadow-lg">
              <div className="bg-[#F7F5EF] border-2 border-[#4B2E24] p-5 text-center space-y-3">
                <img
                  src={settings.logo_url || '/logo.jpg'}
                  alt={settings.brand_name}
                  className="w-12 h-12 rounded-full object-contain mx-auto border border-[#D5C6AD]"
                />
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#241914]">
                    {settings.brand_name}
                  </h3>
                  <p className="text-[10px] text-[#8C7565]">{qrSubtitle}</p>
                  {tableNumber.trim() && (
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[#4B2E24] text-[#F7F5EF] text-[10px] font-bold uppercase tracking-widest rounded">
                      BÀN SỐ: {tableNumber.trim()}
                    </span>
                  )}
                </div>

                <div className="p-2 bg-[#F7F5EF] border border-[#D5C6AD] inline-block mx-auto">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Menu"
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  )}
                </div>

                <div>
                  <p className="font-serif text-sm font-bold text-[#4B2E24] tracking-wide">
                    {qrTitle}
                  </p>
                  <p className="text-[10px] text-[#8C7565] mt-0.5">
                    Mở Camera hoặc Zalo để quét mã
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Restore Dialog */}
      <ConfirmDialog
        open={Boolean(pendingBackupData)}
        title="Xác nhận khôi phục dữ liệu Website?"
        description={`Bạn đang chuẩn bị khôi phục bản sao lưu ngày ${
          pendingBackupData?.exported_at
            ? new Date(pendingBackupData.exported_at).toLocaleString('vi-VN')
            : ''
        }. Dữ liệu Thực đơn, Danh mục và Cài đặt sẽ được đồng bộ theo file này.`}
        confirmLabel="Khôi phục ngay"
        variant="primary"
        loading={restoring}
        onConfirm={handleConfirmRestore}
        onCancel={() => setPendingBackupData(null)}
      />
    </div>
  );
};
