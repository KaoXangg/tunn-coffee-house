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
  Wifi,
  Save,
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
    updatePageSection,
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
  const [showWifiOnQr, setShowWifiOnQr] = useState(true);

  const contactSection = sections.find((s) => s.section_key === 'contact');
  const remoteWifiName = String(contactSection?.content?.wifi_name || '');
  const remoteWifiPassword = String(contactSection?.content?.wifi_password || '');
  const [wifiName, setWifiName] = useState(remoteWifiName);
  const [wifiPassword, setWifiPassword] = useState(remoteWifiPassword);
  const [wifiDirty, setWifiDirty] = useState(false);
  const [savingWifi, setSavingWifi] = useState(false);

  const [prevWifiKey, setPrevWifiKey] = useState(`${remoteWifiName}\0${remoteWifiPassword}`);
  const currentWifiKey = `${remoteWifiName}\0${remoteWifiPassword}`;
  if (currentWifiKey !== prevWifiKey) {
    setPrevWifiKey(currentWifiKey);
    if (!wifiDirty) {
      setWifiName(remoteWifiName);
      setWifiPassword(remoteWifiPassword);
    }
  }

  const handleSaveWifi = async () => {
    setSavingWifi(true);
    try {
      const { error } = await updatePageSection('contact', {
        content: {
          ...(contactSection?.content || {}),
          wifi_name: wifiName.trim(),
          wifi_password: wifiPassword.trim(),
        },
      });
      if (error) {
        toast.info('Đã cập nhật tạm thời', error);
      } else {
        setWifiDirty(false);
        toast.success('Đã lưu thông tin Wi-Fi!', 'Tên và mật khẩu Wi-Fi đã được lưu vào hệ thống.');
      }
    } finally {
      setSavingWifi(false);
    }
  };
  const [tableNumber, setTableNumber] = useState('');
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [batchStartTable, setBatchStartTable] = useState<string>('1');
  const [batchEndTable, setBatchEndTable] = useState<string>('8');

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

  const handlePrintBatchTableQrsA4 = () => {
    const start = Math.max(1, Math.min(200, Math.floor(Number(batchStartTable) || 1)));
    const end = Math.max(start, Math.min(start + 47, Math.floor(Number(batchEndTable) || start)));
    const cleanTarget = qrTargetUrl.trim() || 'https://tunn-coffee-house.vercel.app/#menu';

    const buildTableUrl = (tNum: string) => {
      const encoded = encodeURIComponent(tNum);
      if (cleanTarget.includes('#')) {
        const [basePart, hashPart] = cleanTarget.split('#');
        const sep = basePart.includes('?') ? '&' : '?';
        return `${basePart}${sep}table=${encoded}#${hashPart}`;
      }
      const sep = cleanTarget.includes('?') ? '&' : '?';
      return `${cleanTarget}${sep}table=${encoded}`;
    };

    const cardsHtml: string[] = [];
    for (let num = start; num <= end; num++) {
      const labelNum = String(num).padStart(2, '0');
      const url = buildTableUrl(labelNum);
      const dataUrl = renderQrToDataUrl(url, {
        pixelSize: 320,
        marginModules: 2,
        darkColor: '#4B2E24',
        lightColor: '#F7F5EF',
      });
      const wifiHtml =
        showWifiOnQr && (wifiName.trim() || wifiPassword.trim())
          ? `<div class="wifi-box">
              ${wifiName.trim() ? `<div>Wi-Fi: <strong>${wifiName.trim()}</strong></div>` : ''}
              ${wifiPassword.trim() ? `<div class="mono">Pass: <strong>${wifiPassword.trim()}</strong></div>` : ''}
            </div>`
          : '';
      cardsHtml.push(`
        <div class="qr-card">
          <div class="qr-inner">
            <div class="brand-name">${settings.brand_name || 'TUNN Coffee House'}</div>
            <div class="table-badge">BÀN SỐ: ${labelNum}</div>
            <img class="qr-img" src="${dataUrl}" alt="QR Bàn ${labelNum}" />
            <div class="qr-title">${qrTitle || 'QUÉT MÃ XEM THỰC ĐƠN'}</div>
            ${wifiHtml}
          </div>
        </div>
      `);
    }

    const win = window.open('', '_blank', 'width=960,height=780');
    if (!win) {
      toast.error('Trình duyệt đang chặn cửa sổ bật lên', 'Vui lòng cho phép pop-up để in tem QR hàng loạt.');
      return;
    }

    win.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>In Tem QR Bàn ${String(start).padStart(2, '0')} - ${String(end).padStart(2, '0')} — ${settings.brand_name || 'TUNN Coffee House'}</title>
          <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700&family=Lora:wght@600;700&display=swap" rel="stylesheet" />
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Be Vietnam Pro', sans-serif;
              color: #241914;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 6mm;
            }
            .qr-card {
              border: 1px dashed #8C7565;
              padding: 3.5mm;
              background: #F7F5EF;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .qr-inner {
              border: 1.5px solid #4B2E24;
              padding: 3.5mm;
              text-align: center;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1.8mm;
            }
            .brand-name {
              font-family: 'Lora', serif;
              font-size: 13pt;
              font-weight: 700;
              color: #241914;
            }
            .table-badge {
              display: inline-block;
              background: #4B2E24;
              color: #F7F5EF;
              font-size: 8.5pt;
              font-weight: 700;
              letter-spacing: 0.08em;
              padding: 1mm 3mm;
              border-radius: 3px;
            }
            .qr-img {
              width: 31mm;
              height: 31mm;
              object-fit: contain;
              border: 1px solid #D5C6AD;
              padding: 1mm;
              background: #F7F5EF;
            }
            .qr-title {
              font-family: 'Lora', serif;
              font-size: 8.5pt;
              font-weight: 700;
              color: #4B2E24;
            }
            .wifi-box {
              width: 100%;
              background: #E9E6D8;
              border: 1px solid #D5C6AD;
              border-radius: 3px;
              padding: 1.2mm 2mm;
              font-size: 7.5pt;
              line-height: 1.35;
              color: #241914;
            }
            .mono { font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="grid">${cardsHtml.join('')}</div>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 400); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
    logAdminActivity(
      `In bảng QR bàn hàng loạt (Bàn ${String(start).padStart(2, '0')} - ${String(end).padStart(2, '0')})`,
      'qr'
    );
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

      const cleanWifiName = wifiName.trim();
      const cleanWifiPassword = wifiPassword.trim();
      if (showWifiOnQr && (cleanWifiName || cleanWifiPassword)) {
        const hasBoth = Boolean(cleanWifiName && cleanWifiPassword);
        ctx.fillStyle = '#E9E6D8';
        ctx.fillRect(120, 974, 660, hasBoth ? 64 : 44);
        ctx.strokeStyle = '#D5C6AD';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(120, 974, 660, hasBoth ? 64 : 44);

        ctx.fillStyle = '#241914';
        if (hasBoth) {
          ctx.font = '600 19px "Be Vietnam Pro", sans-serif';
          ctx.fillText(`Wi-Fi: ${cleanWifiName}`, 450, 1001);
          ctx.font = '700 19px monospace';
          ctx.fillText(`Pass: ${cleanWifiPassword}`, 450, 1027);
        } else {
          ctx.font = '600 20px "Be Vietnam Pro", sans-serif';
          ctx.fillText(
            cleanWifiName ? `Wi-Fi: ${cleanWifiName}` : `Pass: ${cleanWifiPassword}`,
            450,
            1002
          );
        }
      }

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
        <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
          Sao Lưu Dữ Liệu 1-Click & Tạo Mã QR Menu Đặt Bàn
        </h1>
        <p className="text-sm text-coffee-muted mt-1">
          Bảo vệ an toàn tuyệt đối dữ liệu của quán và tạo thẻ QR Thực đơn chuẩn màu thương hiệu để in dán tại bàn.
        </p>
      </div>

      {/* SECTION 1: 1-CLICK BACKUP & RESTORE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Backup Card */}
        <div className="bg-white border border-coffee-beige rounded-brand p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-ivory text-coffee rounded-brand text-xs font-semibold uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" />
              <span>Sao Lưu Toàn Bộ (Export Backup)</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-coffee-dark">
              Tải Xuống Bản Sao Lưu Website (.json)
            </h2>
            <p className="text-xs sm:text-sm text-coffee-muted leading-relaxed">
              Chỉ với 1 cú nhấp chuột, toàn bộ dữ liệu hiện tại của quán sẽ được đóng gói thành 1 file duy nhất để bạn cất giữ an toàn trong máy tính hoặc Google Drive:
            </p>
            <ul className="grid grid-cols-2 gap-2 text-xs text-coffee-dark pt-1">
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
            className="w-full py-3 px-5 bg-coffee hover:bg-coffee-dark text-ivory-light text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải Xuống Bản Sao Lưu Ngay (.JSON)</span>
          </button>
        </div>

        {/* Restore Backup Card */}
        <div className="bg-white border border-coffee-beige rounded-brand p-6 flex flex-col justify-between space-y-5 shadow-xs">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-900 rounded-brand text-xs font-semibold uppercase tracking-wider">
              <Upload className="w-3.5 h-3.5" />
              <span>Khôi Phục Dữ Liệu (1-Click Restore)</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold text-coffee-dark">
              Khôi Phục Từ File Sao Lưu Đã Lưu
            </h2>
            <p className="text-xs sm:text-sm text-coffee-muted leading-relaxed">
              Nếu bạn lỡ tay xóa nhầm món hoặc chỉnh sửa sai nội dung, chỉ cần chọn lại file <code className="font-mono bg-ivory-light px-1 rounded">.json</code> đã tải về trước đó. Hệ thống sẽ đồng bộ toàn bộ dữ liệu quay về nguyên trạng trong 3 giây.
            </p>
            <div className="p-3 bg-ivory-light border border-coffee-beige rounded-brand text-xs text-coffee-muted flex items-start gap-2">
              <Database className="w-4 h-4 text-coffee shrink-0 mt-0.5" />
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
              className="w-full py-3 px-5 border-2 border-coffee text-coffee hover:bg-ivory text-xs font-semibold uppercase tracking-[0.18em] rounded-brand transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Chọn File Backup (.JSON) Để Khôi Phục</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: QR CODE MENU STANDEE GENERATOR */}
      <div className="bg-white border border-coffee-beige rounded-brand p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-coffee-beige mb-6">
          <QrCode className="w-6 h-6 text-coffee" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-coffee-dark">
              Bộ Tạo Mã QR Menu Đặt Bàn & Ấn Phẩm In Ấn
            </h2>
            <p className="text-xs text-coffee-muted">
              Tạo thẻ QR mang sắc nâu cà phê & kem ngà đồng bộ thương hiệu để in dán lên bàn, quầy thu ngân hoặc ly mang đi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* QR Controls */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Đường dẫn khi khách quét mã QR
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={qrTargetUrl}
                  onChange={(e) => setQrTargetUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-ivory-light border border-coffee-beige rounded-brand font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(finalQrDestination);
                    toast.success('Đã sao chép đường dẫn Menu!');
                  }}
                  className="px-3.5 py-2 bg-ivory text-coffee-dark hover:bg-coffee-beige rounded-brand text-xs font-semibold flex items-center gap-1.5"
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
                  className="text-[11px] px-2.5 py-1 bg-ivory-light border border-coffee-beige rounded hover:bg-ivory"
                >
                  Mở thẳng Thực đơn (#menu)
                </button>
                <button
                  type="button"
                  onClick={() => setQrTargetUrl('https://tunn-coffee-house.vercel.app')}
                  className="text-[11px] px-2.5 py-1 bg-ivory-light border border-coffee-beige rounded hover:bg-ivory"
                >
                  Mở Trang chủ
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQrTargetUrl('https://tunn-coffee-house.vercel.app/#promotions')
                  }
                  className="text-[11px] px-2.5 py-1 bg-ivory-light border border-coffee-beige rounded hover:bg-ivory"
                >
                  Mở khu vực Ưu đãi (#promotions)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Tiêu đề in trên Thẻ QR
                </label>
                <input
                  type="text"
                  value={qrTitle}
                  onChange={(e) => setQrTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                  Số bàn (Tùy chọn - Để trống nếu dùng chung)
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="VD: 01, 02, VIP..."
                  className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-coffee-dark mb-1.5">
                Dòng phụ đề thương hiệu
              </label>
              <input
                type="text"
                value={qrSubtitle}
                onChange={(e) => setQrSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand"
              />
            </div>

            <div className="p-4 bg-ivory-light/70 border border-coffee-beige rounded-brand space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="flex items-center gap-2 text-xs font-semibold text-coffee-dark cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWifiOnQr}
                    onChange={(e) => setShowWifiOnQr(e.target.checked)}
                    className="rounded border-coffee-beige text-coffee"
                  />
                  <Wifi className="w-3.5 h-3.5 text-coffee shrink-0" />
                  <span>In kèm Tên &amp; Mật khẩu Wi-Fi lên thẻ QR</span>
                </label>

                <button
                  type="button"
                  onClick={handleSaveWifi}
                  disabled={savingWifi}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-coffee-beige text-coffee-dark hover:bg-ivory rounded-brand transition-colors disabled:opacity-50"
                >
                  {savingWifi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu Wi-Fi</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-coffee-muted mb-1">
                    Tên Wi-Fi quán
                  </label>
                  <input
                    type="text"
                    value={wifiName}
                    onChange={(e) => {
                      setWifiDirty(true);
                      setWifiName(e.target.value);
                    }}
                    placeholder="VD: TUNN Coffee House"
                    className="w-full px-3 py-2 text-sm bg-white border border-coffee-beige rounded-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-coffee-muted mb-1">
                    Mật khẩu Wi-Fi
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => {
                      setWifiDirty(true);
                      setWifiPassword(e.target.value);
                    }}
                    placeholder="VD: tunncoffee2026"
                    className="w-full px-3 py-2 text-sm bg-white border border-coffee-beige rounded-brand font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={downloadingQr}
                onClick={handleDownloadPrintableCard}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
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
                className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider border border-coffee-beige text-coffee-dark hover:bg-ivory rounded-brand"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Chỉ tải riêng hình QR</span>
              </button>
            </div>

            {/* Batch Table QR A4 Sheet Printer (8 Tables / A4 Page) */}
            <div className="p-4 bg-ivory/70 border border-coffee-beige rounded-brand space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-coffee-dark">
                    In Tem Bàn QR Hàng Loạt (8 bàn / trang A4)
                  </p>
                  <p className="text-[11px] text-coffee-muted">
                    Tự động dàn trang A4 có đường cắt rời, đánh số từng bàn và kèm sẵn Wi-Fi để in 1 lần dán cho cả quán.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-coffee-muted mb-1">
                    Từ bàn số
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={batchStartTable}
                    onChange={(e) => setBatchStartTable(e.target.value)}
                    placeholder="1"
                    className="w-24 px-3 py-1.5 text-sm bg-white border border-coffee-beige rounded-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-coffee-muted mb-1">
                    Đến bàn số
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={batchEndTable}
                    onChange={(e) => setBatchEndTable(e.target.value)}
                    placeholder="8"
                    className="w-24 px-3 py-1.5 text-sm bg-white border border-coffee-beige rounded-brand"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePrintBatchTableQrsA4}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    In Bảng QR Hàng Loạt (Bàn{' '}
                    {String(Math.max(1, Number(batchStartTable) || 1)).padStart(2, '0')} →{' '}
                    {String(
                      Math.max(Number(batchStartTable) || 1, Number(batchEndTable) || 1)
                    ).padStart(2, '0')}
                    )
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Standee Card Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-72 bg-ivory p-4 rounded-brand border border-coffee-beige shadow-lg">
              <div className="bg-ivory-light border-2 border-coffee p-5 text-center space-y-3">
                <img
                  src={settings.logo_url || '/logo.jpg'}
                  alt={settings.brand_name}
                  className="w-12 h-12 rounded-full object-contain mx-auto border border-coffee-beige"
                />
                <div>
                  <h3 className="font-serif text-xl font-bold text-coffee-dark">
                    {settings.brand_name}
                  </h3>
                  <p className="text-[10px] text-coffee-muted">{qrSubtitle}</p>
                  {tableNumber.trim() && (
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-coffee text-ivory-light text-[10px] font-bold uppercase tracking-widest rounded">
                      BÀN SỐ: {tableNumber.trim()}
                    </span>
                  )}
                </div>

                <div className="p-2 bg-ivory-light border border-coffee-beige inline-block mx-auto">
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Menu"
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  )}
                </div>

                <div>
                  <p className="font-serif text-sm font-bold text-coffee tracking-wide">
                    {qrTitle}
                  </p>
                  <p className="text-[10px] text-coffee-muted mt-0.5">
                    Mở Camera hoặc Zalo để quét mã
                  </p>
                  {showWifiOnQr && (wifiName.trim() || wifiPassword.trim()) && (
                    <div className="mt-2 px-3 py-1.5 bg-ivory border border-coffee-beige rounded-brand text-[10px] text-coffee-dark font-medium flex flex-col items-center gap-0.5 leading-snug">
                      {wifiName.trim() && (
                        <span className="inline-flex items-center gap-1 break-all">
                          <Wifi className="w-3 h-3 text-coffee shrink-0" />
                          <span>Wi-Fi: {wifiName.trim()}</span>
                        </span>
                      )}
                      {wifiPassword.trim() && (
                        <span className="font-mono font-semibold break-all">
                          Pass: {wifiPassword.trim()}
                        </span>
                      )}
                    </div>
                  )}
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
