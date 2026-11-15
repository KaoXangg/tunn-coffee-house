import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Zap,
  LayoutList,
  DollarSign,
  Printer,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useSiteData } from '../../contexts/SiteDataContext';
import { useToast } from '../../contexts/ToastContext';
import { formatVND, slugify } from '../../lib/utils';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal } from '../../components/common/MediaPickerModal';
import type { Product } from '../../types/database';

const productSchema = z.object({
  name: z.string().min(2, 'Tên món cần ít nhất 2 ký tự'),
  slug: z.string().min(2, 'Slug không được để trống'),
  description: z.string().min(4, 'Vui lòng nhập mô tả món'),
  image_url: z.string().min(1, 'Vui lòng chọn hoặc nhập URL hình ảnh'),
  price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
  sale_price: z
    .union([z.coerce.number().min(0), z.literal(''), z.null()])
    .optional(),
  category_id: z.string().nullable().optional(),
  badge: z.string().optional(),
  is_featured: z.boolean(),
  is_best_seller: z.boolean(),
  is_available: z.boolean(),
  is_visible: z.boolean(),
  sort_order: z.coerce.number().int(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const ITEMS_PER_PAGE = 8;

export const AdminProductsPage: React.FC = () => {
  const { products, categories, settings, refreshAll, logAdminActivity } = useSiteData();
  const toast = useToast();

  // View Mode: 'full' (Standard Table) | 'counter' (1-Tap Quick Counter Mode for Mobile/Tablet)
  const [viewMode, setViewMode] = useState<'full' | 'counter'>('full');

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'visible' | 'hidden' | 'featured' | 'soldout'
  >('all');
  const [sortBy, setSortBy] = useState<'order' | 'price-asc' | 'price-desc' | 'name'>(
    'order'
  );
  const [page, setPage] = useState(1);

  // Bulk Selection & Batch Price Adjustment State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkPriceUnit, setBulkPriceUnit] = useState<'percent' | 'vnd'>('percent');

  // Inline Price Editing State
  const [inlinePriceId, setInlinePriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<string>('');
  const [inlineSalePriceVal, setInlineSalePriceVal] = useState<string>('');
  const [savingInline, setSavingInline] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
      price: 55000,
      sale_price: '',
      category_id: categories[0]?.id || '',
      badge: '',
      is_featured: false,
      is_best_seller: false,
      is_available: true,
      is_visible: true,
      sort_order: products.length + 1,
    },
  });

  const watchedImage = form.watch('image_url');

  const openCreateModal = () => {
    setEditingProduct(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      image_url:
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      price: 59000,
      sale_price: '',
      category_id: categories[0]?.id || '',
      badge: '',
      is_featured: false,
      is_best_seller: false,
      is_available: true,
      is_visible: true,
      sort_order: products.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    form.reset({
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      image_url: prod.image_url,
      price: prod.price,
      sale_price: prod.sale_price ?? '',
      category_id: prod.category_id || '',
      badge: prod.badge || '',
      is_featured: prod.is_featured,
      is_best_seller: prod.is_best_seller,
      is_available: prod.is_available,
      is_visible: prod.is_visible,
      sort_order: prod.sort_order,
    });
    setModalOpen(true);
  };

  // Duplicate Product (1-Click Clone)
  const handleDuplicateProduct = async (prod: Product) => {
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase');
      return;
    }

    const newName = `${prod.name} (Bản sao)`;
    const newSlug = `${prod.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from('products').insert({
      name: newName,
      slug: newSlug,
      description: prod.description,
      image_url: prod.image_url,
      price: prod.price,
      sale_price: prod.sale_price,
      category_id: prod.category_id,
      badge: prod.badge,
      is_featured: false,
      is_best_seller: false,
      is_available: prod.is_available,
      is_visible: prod.is_visible,
      sort_order: products.length + 1,
    });

    if (error) {
      toast.error('Không thể nhân bản món', error.message);
    } else {
      await logAdminActivity('Nhân bản sản phẩm', 'products', newName);
      await refreshAll();
      toast.success('Đã nhân bản món thành công!', newName);
    }
  };

  // Start Inline Price Edit
  const startInlinePriceEdit = (prod: Product) => {
    setInlinePriceId(prod.id);
    setInlinePriceVal(String(prod.price));
    setInlineSalePriceVal(prod.sale_price ? String(prod.sale_price) : '');
  };

  // Save Inline Price Edit
  const handleSaveInlinePrice = async (prod: Product) => {
    if (!isSupabaseConfigured) return;
    setSavingInline(true);
    try {
      const nextPrice = Math.max(0, Number(inlinePriceVal) || 0);
      const nextSale =
        inlineSalePriceVal.trim() === '' || Number(inlineSalePriceVal) <= 0
          ? null
          : Number(inlineSalePriceVal);

      const { error } = await supabase
        .from('products')
        .update({ price: nextPrice, sale_price: nextSale })
        .eq('id', prod.id);

      if (error) throw error;
      await logAdminActivity(
        `Sửa nhanh giá: ${formatVND(nextSale || nextPrice)}`,
        'products',
        prod.name
      );
      await refreshAll();
      toast.success('Đã cập nhật giá bán!', prod.name);
      setInlinePriceId(null);
    } catch (err: any) {
      toast.error('Lỗi cập nhật giá', err?.message);
    } finally {
      setSavingInline(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = products.filter((p) => {
      if (filterCategory !== 'all' && p.category_id !== filterCategory) return false;
      if (filterStatus === 'visible' && !p.is_visible) return false;
      if (filterStatus === 'hidden' && p.is_visible) return false;
      if (filterStatus === 'featured' && !p.is_featured) return false;
      if (filterStatus === 'soldout' && p.is_available) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
      return a.sort_order - b.sort_order;
    });
  }, [products, search, filterCategory, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const onSubmit = async (values: ProductFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error(
        'Chưa kết nối Supabase Database',
        'Vui lòng cấu hình VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim() || slugify(values.name),
        description: values.description.trim(),
        image_url: values.image_url.trim(),
        price: Number(values.price),
        sale_price:
          values.sale_price === '' ||
          values.sale_price === null ||
          values.sale_price === undefined ||
          Number(values.sale_price) <= 0
            ? null
            : Number(values.sale_price),
        category_id: values.category_id || null,
        badge: values.badge?.trim() || '',
        is_featured: values.is_featured,
        is_best_seller: values.is_best_seller,
        is_available: values.is_available,
        is_visible: values.is_visible,
        sort_order: Number(values.sort_order),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
        await logAdminActivity('Cập nhật sản phẩm', 'products', payload.name);
        toast.success('Đã cập nhật món', payload.name);
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        await logAdminActivity('Thêm sản phẩm mới', 'products', payload.name);
        toast.success('Đã thêm món mới', payload.name);
      }

      await refreshAll();
      setModalOpen(false);
    } catch (err: any) {
      toast.error('Lỗi lưu sản phẩm', err?.message || 'Không thể lưu vào database');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleQuickField = async (
    prod: Product,
    field: 'is_visible' | 'is_featured' | 'is_available'
  ) => {
    if (!isSupabaseConfigured) {
      toast.info('Chưa kết nối Supabase');
      return;
    }

    const nextVal = !prod[field];
    const { error } = await supabase
      .from('products')
      .update({ [field]: nextVal })
      .eq('id', prod.id);

    if (error) {
      toast.error('Không thể cập nhật trạng thái', error.message);
    } else {
      const actionLabel =
        field === 'is_available'
          ? nextVal
            ? 'Mở bán lại món'
            : 'Báo tạm hết món'
          : field === 'is_visible'
            ? nextVal
              ? 'Hiện món trên thực đơn'
              : 'Ẩn món khỏi thực đơn'
            : nextVal
              ? 'Đánh dấu món nổi bật'
              : 'Bỏ đánh dấu nổi bật';
      await logAdminActivity(actionLabel, 'products', prod.name);
      await refreshAll();
      toast.success(
        field === 'is_available'
          ? nextVal
            ? `Đã mở bán lại: ${prod.name}`
            : `Đã báo tạm hết: ${prod.name}`
          : 'Đã cập nhật trạng thái',
        prod.name
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!isSupabaseConfigured) {
      setDeleteTarget(null);
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;
      await logAdminActivity('Xóa sản phẩm', 'products', deleteTarget.name);
      await refreshAll();
      toast.success('Đã xóa sản phẩm', deleteTarget.name);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Lỗi khi xóa sản phẩm', err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return 'Chưa phân loại';
    return categories.find((c) => c.id === catId)?.name || 'Chưa phân loại';
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = (pageItems: Product[]) => {
    const pageIds = pageItems.map((p) => p.id);
    const allSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleBulkUpdateField = async (
    field: 'is_available' | 'is_visible',
    value: boolean,
    label: string
  ) => {
    if (selectedIds.length === 0) return;
    if (!isSupabaseConfigured) {
      toast.error('Chưa kết nối Supabase Database');
      return;
    }

    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ [field]: value })
        .in('id', selectedIds);

      if (error) throw error;
      await logAdminActivity(
        `${label} (${selectedIds.length} món)`,
        'products',
        `${selectedIds.length} sản phẩm`
      );
      await refreshAll();
      toast.success(`Đã ${label.toLowerCase()} cho ${selectedIds.length} món`);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error('Lỗi thao tác hàng loạt', err?.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkAdjustPrice = async () => {
    const delta = Number(bulkPriceInput);
    if (!bulkPriceInput.trim() || isNaN(delta) || delta === 0) {
      toast.error('Vui lòng nhập mức điều chỉnh giá hợp lệ (VD: 10 hoặc -5000)');
      return;
    }
    if (selectedIds.length === 0 || !isSupabaseConfigured) return;

    setBulkProcessing(true);
    try {
      const targets = products.filter((p) => selectedIds.includes(p.id));
      for (const prod of targets) {
        const nextPrice =
          bulkPriceUnit === 'percent'
            ? Math.max(0, Math.round((Number(prod.price) * (1 + delta / 100)) / 1000) * 1000)
            : Math.max(0, Number(prod.price) + delta);

        const nextSalePrice =
          prod.sale_price && Number(prod.sale_price) > 0
            ? bulkPriceUnit === 'percent'
              ? Math.max(
                  0,
                  Math.round((Number(prod.sale_price) * (1 + delta / 100)) / 1000) * 1000
                )
              : Math.max(0, Number(prod.sale_price) + delta)
            : null;

        const { error } = await supabase
          .from('products')
          .update({ price: nextPrice, sale_price: nextSalePrice })
          .eq('id', prod.id);
        if (error) throw error;
      }

      await logAdminActivity(
        `Điều chỉnh giá hàng loạt (${delta > 0 ? '+' : ''}${delta}${
          bulkPriceUnit === 'percent' ? '%' : 'đ'
        })`,
        'products',
        `${targets.length} sản phẩm`
      );
      await refreshAll();
      toast.success(`Đã cập nhật giá cho ${targets.length} món`);
      setBulkPriceInput('');
      setSelectedIds([]);
    } catch (err: any) {
      toast.error('Lỗi cập nhật giá hàng loạt', err?.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handlePrintMenuA4 = () => {
    const visibleItems = products
      .filter((p) => p.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order);

    const activeCats = [...categories]
      .filter((c) => c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    const groupedHtml = activeCats
      .map((cat) => {
        const items = visibleItems.filter((p) => p.category_id === cat.id);
        if (items.length === 0) return '';
        const rows = items
          .map((item) => {
            const hasSale =
              item.sale_price !== null &&
              item.sale_price !== undefined &&
              Number(item.sale_price) > 0 &&
              Number(item.sale_price) < Number(item.price);
            const displayPrice = formatVND(hasSale ? item.sale_price : item.price);
            return `
              <div class="menu-item">
                <div class="menu-row">
                  <span class="item-name">${item.name}${
                    !item.is_available ? ' <em>(Tạm hết)</em>' : ''
                  }</span>
                  <span class="dots"></span>
                  <span class="item-price">${displayPrice}</span>
                </div>
                ${item.description ? `<p class="item-desc">${item.description}</p>` : ''}
              </div>
            `;
          })
          .join('');

        return `
          <section class="cat-block">
            <h2 class="cat-title">${cat.name}</h2>
            <div class="cat-grid">${rows}</div>
          </section>
        `;
      })
      .join('');

    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) {
      toast.error('Trình duyệt đang chặn cửa sổ mở mới', 'Vui lòng cho phép pop-up để in thực đơn.');
      return;
    }

    win.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Thực Đơn — ${settings.brand_name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Lora:ital,wght@0,500;0,600;1,400&display=swap" rel="stylesheet" />
          <style>
            @page { size: A4; margin: 16mm 18mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Be Vietnam Pro', sans-serif;
              color: #241914;
              background: #fff;
              line-height: 1.45;
              padding: 12px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #4B2E24;
              padding-bottom: 14px;
              margin-bottom: 20px;
            }
            .brand {
              font-family: 'Lora', serif;
              font-size: 28px;
              font-weight: 600;
              letter-spacing: 0.04em;
            }
            .sub {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              color: #8C7565;
              margin-top: 4px;
            }
            .cat-block { margin-bottom: 20px; break-inside: avoid; }
            .cat-title {
              font-family: 'Lora', serif;
              font-size: 17px;
              font-weight: 600;
              color: #4B2E24;
              border-bottom: 1px solid #D5C6AD;
              padding-bottom: 4px;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            .cat-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 26px;
            }
            .menu-item { break-inside: avoid; }
            .menu-row {
              display: flex;
              align-items: baseline;
              gap: 6px;
            }
            .item-name {
              font-family: 'Lora', serif;
              font-size: 13.5px;
              font-weight: 600;
            }
            .dots {
              flex: 1;
              border-bottom: 1px dotted #C5B399;
            }
            .item-price {
              font-family: 'Lora', serif;
              font-size: 13.5px;
              font-weight: 600;
              color: #4B2E24;
              white-space: nowrap;
            }
            .item-desc {
              font-size: 10.5px;
              color: #6E594B;
              margin-top: 2px;
            }
            .footer {
              margin-top: 22px;
              padding-top: 10px;
              border-top: 1px solid #D5C6AD;
              text-align: center;
              font-size: 10.5px;
              color: #8C7565;
            }
          </style>
        </head>
        <body>
          <header class="header">
            <h1 class="brand">${settings.brand_name || 'TUNN Coffee House'}</h1>
            <p class="sub">Thực Đơn Thức Uống Thủ Công · ${settings.opening_hours || '07:30 — 22:30'}</p>
          </header>
          ${groupedHtml}
          <footer class="footer">
            ${settings.address ? `${settings.address} · ` : ''}${
              settings.hotline ? `Hotline: ${settings.hotline}` : settings.slogan
            }
          </footer>
          <script>
            window.onload = function() { setTimeout(function() { window.print(); }, 350); };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-[#241914]">
            Quản Lý Thực Đơn & Sản Phẩm
          </h1>
          <p className="text-sm text-[#8C7565] mt-1">
            Chạm vào giá tiền để sửa nhanh tại chỗ, bấm Nhân bản để tạo món tương tự hoặc bật Chế độ Tại Quầy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Counter Quick Mode Switch */}
          <div className="inline-flex rounded-brand border border-[#D5C6AD] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-brand transition-colors ${
                viewMode === 'full'
                  ? 'bg-[#4B2E24] text-[#F7F5EF]'
                  : 'text-[#241914] hover:bg-[#E9E6D8]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Bảng Đầy Đủ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('counter')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-brand transition-colors ${
                viewMode === 'counter'
                  ? 'bg-[#4B2E24] text-[#F7F5EF]'
                  : 'text-[#241914] hover:bg-[#E9E6D8]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Chế Độ Tại Quầy (1-Chạm)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintMenuA4}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-white border border-[#D5C6AD] text-[#241914] hover:bg-[#E9E6D8] rounded-brand transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In Thực Đơn A4</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-[#D5C6AD] rounded-brand p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-[#8C7565] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm nhanh tên món để báo hết / sửa giá..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand focus:outline-none focus:border-[#4B2E24]"
          />
        </div>

        <div className="lg:col-span-3">
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo danh mục"
            className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
          >
            <option value="all">Mọi trạng thái</option>
            <option value="visible">Đang hiển thị</option>
            <option value="soldout">Đang báo Hết món</option>
            <option value="hidden">Đang tạm ẩn</option>
            <option value="featured">Món nổi bật (Featured)</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sắp xếp"
            className="w-full px-3 py-2 text-xs font-medium bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand"
          >
            <option value="order">Thứ tự hiển thị</option>
            <option value="price-asc">Giá tăng dần</option>
            <option value="price-desc">Giá giảm dần</option>
            <option value="name">Tên A → Z</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: QUICK COUNTER MODE (1-TAP MOBILE/TABLET GRID) */}
      {viewMode === 'counter' ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-[#E9E6D8] border border-[#D5C6AD] rounded-brand flex items-center justify-between text-xs text-[#241914]">
            <span className="inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4B2E24] shrink-0" />
              <span>
                <strong>Chế độ Tại Quầy (1-Chạm):</strong> Chạm trực tiếp vào nút{' '}
                <strong>CÒN MÓN / TẠM HẾT</strong> để cập nhật ngay lên website khách hàng.
              </span>
            </span>
            <span className="font-semibold">
              {filteredProducts.filter((p) => p.is_available).length}/
              {filteredProducts.length} món đang phục vụ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className={`p-4 rounded-brand border transition-all flex items-center justify-between gap-3 ${
                  prod.is_available
                    ? 'bg-white border-[#D5C6AD]'
                    : 'bg-red-50/60 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className={`w-14 h-14 rounded-brand object-cover border border-[#D5C6AD] shrink-0 ${
                      !prod.is_available ? 'grayscale opacity-70' : ''
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-base font-bold text-[#241914] truncate">
                      {prod.name}
                    </p>
                    <p className="text-xs font-semibold text-[#4B2E24] mt-0.5">
                      {formatVND(prod.sale_price || prod.price)}
                    </p>
                    <p className="text-[10px] text-[#8C7565]">
                      {getCategoryName(prod.category_id)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleQuickField(prod, 'is_available')}
                  className={`px-4 py-3 rounded-brand text-xs font-bold uppercase tracking-wider shrink-0 transition-all shadow-xs ${
                    prod.is_available
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-red-700 text-white hover:bg-red-800'
                  }`}
                >
                  {prod.is_available ? 'CÒN MÓN' : 'TẠM HẾT'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: FULL TABLE WITH INLINE PRICE EDIT & DUPLICATE */
        <div className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="p-3.5 bg-[#241914] text-[#F7F5EF] rounded-brand flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold">
                  Đã chọn {selectedIds.length} món
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-[#D5C6AD] hover:text-white underline"
                >
                  Bỏ chọn
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={bulkProcessing}
                  onClick={() =>
                    handleBulkUpdateField('is_available', false, 'Báo hết hàng loạt')
                  }
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-red-700 hover:bg-red-800 text-white rounded-brand disabled:opacity-50"
                >
                  Báo hết
                </button>
                <button
                  type="button"
                  disabled={bulkProcessing}
                  onClick={() =>
                    handleBulkUpdateField('is_available', true, 'Mở bán hàng loạt')
                  }
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-emerald-700 hover:bg-emerald-800 text-white rounded-brand disabled:opacity-50"
                >
                  Mở bán lại
                </button>
                <button
                  type="button"
                  disabled={bulkProcessing}
                  onClick={() =>
                    handleBulkUpdateField('is_visible', false, 'Ẩn hàng loạt')
                  }
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-[#4B2E24] hover:bg-[#5c392d] text-white rounded-brand disabled:opacity-50"
                >
                  Ẩn trên Web
                </button>
                <button
                  type="button"
                  disabled={bulkProcessing}
                  onClick={() =>
                    handleBulkUpdateField('is_visible', true, 'Hiện hàng loạt')
                  }
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-[#4B2E24] hover:bg-[#5c392d] text-white rounded-brand disabled:opacity-50"
                >
                  Hiện trên Web
                </button>

                <div className="flex items-center gap-1.5 pl-2 border-l border-[#4B2E24]">
                  <input
                    type="number"
                    value={bulkPriceInput}
                    onChange={(e) => setBulkPriceInput(e.target.value)}
                    placeholder="+10 hoặc -5000"
                    className="w-28 px-2.5 py-1 text-xs bg-white text-[#241914] rounded-brand"
                  />
                  <select
                    value={bulkPriceUnit}
                    onChange={(e) => setBulkPriceUnit(e.target.value as 'percent' | 'vnd')}
                    className="px-2 py-1 text-xs bg-white text-[#241914] rounded-brand"
                  >
                    <option value="percent">%</option>
                    <option value="vnd">VNĐ</option>
                  </select>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={handleBulkAdjustPrice}
                    className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-[#D5C6AD] text-[#241914] hover:bg-white rounded-brand disabled:opacity-50"
                  >
                    Đổi giá
                  </button>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white border border-[#D5C6AD] rounded-brand overflow-hidden">
          {paginatedProducts.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-serif text-xl text-[#241914]">
                Không tìm thấy sản phẩm nào
              </p>
              <p className="text-xs text-[#8C7565] mt-1">
                Hãy thử bộ lọc khác hoặc nhấn &ldquo;Thêm Món Mới&rdquo;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#E9E6D8] border-b border-[#D5C6AD] text-[11px] uppercase tracking-wider text-[#241914] font-semibold">
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          paginatedProducts.length > 0 &&
                          paginatedProducts.every((p) => selectedIds.includes(p.id))
                        }
                        onChange={() => toggleSelectPage(paginatedProducts)}
                        aria-label="Chọn tất cả món trong trang"
                        className="rounded border-[#D5C6AD] text-[#4B2E24]"
                      />
                    </th>
                    <th className="py-3.5 px-4">Món đồ uống</th>
                    <th className="py-3.5 px-4">Danh mục</th>
                    <th className="py-3.5 px-4">Giá bán (Chạm để sửa nhanh)</th>
                    <th className="py-3.5 px-4 text-center">Nổi bật</th>
                    <th className="py-3.5 px-4 text-center">Còn món</th>
                    <th className="py-3.5 px-4 text-center">Hiển thị</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9E6D8] text-sm">
                  {paginatedProducts.map((prod) => {
                    const isEditingPrice = inlinePriceId === prod.id;
                    const isChecked = selectedIds.includes(prod.id);
                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-[#F7F5EF]/60 transition-colors ${
                          isChecked ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectProduct(prod.id)}
                            aria-label={`Chọn ${prod.name}`}
                            className="rounded border-[#D5C6AD] text-[#4B2E24]"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-12 h-12 rounded-brand object-cover border border-[#D5C6AD] shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#241914] truncate">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-[#8C7565]">
                                  #{prod.sort_order}
                                </span>
                                {prod.badge && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-[#E9E6D8] text-[#4B2E24] rounded font-semibold">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-[#241914] whitespace-nowrap">
                          {getCategoryName(prod.category_id)}
                        </td>

                        {/* Inline Price Editor Cell */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isEditingPrice ? (
                            <div className="flex items-center gap-1.5 bg-[#F7F5EF] p-1.5 rounded-brand border border-[#4B2E24]">
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  step="1000"
                                  value={inlinePriceVal}
                                  onChange={(e) => setInlinePriceVal(e.target.value)}
                                  placeholder="Giá gốc"
                                  className="w-24 px-2 py-1 text-xs bg-white border border-[#D5C6AD] rounded"
                                />
                                <input
                                  type="number"
                                  step="1000"
                                  value={inlineSalePriceVal}
                                  onChange={(e) =>
                                    setInlineSalePriceVal(e.target.value)
                                  }
                                  placeholder="Giá KM (tùy chọn)"
                                  className="w-24 px-2 py-1 text-xs bg-white border border-[#D5C6AD] rounded block"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={savingInline}
                                onClick={() => handleSaveInlinePrice(prod)}
                                className="p-1.5 bg-[#4B2E24] text-white rounded hover:bg-[#241914]"
                                title="Lưu giá"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlinePriceId(null)}
                                className="p-1.5 text-[#8C7565] hover:text-[#241914]"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startInlinePriceEdit(prod)}
                              className="group text-left hover:bg-[#E9E6D8]/70 px-2 py-1 -mx-2 rounded transition-colors"
                              title="Nhấn để sửa nhanh giá tiền"
                            >
                              <span className="font-semibold text-[#4B2E24] inline-flex items-center gap-1">
                                {formatVND(prod.sale_price || prod.price)}
                                <DollarSign className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#8C7565]" />
                              </span>
                              {prod.sale_price && prod.sale_price < prod.price && (
                                <span className="block text-[11px] text-[#8C7565] line-through">
                                  {formatVND(prod.price)}
                                </span>
                              )}
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleQuickField(prod, 'is_featured')}
                            className={`p-1.5 rounded-brand transition-colors ${
                              prod.is_featured
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-[#8C7565] hover:bg-[#E9E6D8]'
                            }`}
                            title="Bật/Tắt món nổi bật"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                prod.is_featured ? 'fill-amber-600' : ''
                              }`}
                            />
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleQuickField(prod, 'is_available')}
                            className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-brand ${
                              prod.is_available
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {prod.is_available ? 'Còn món' : 'Hết món'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleQuickField(prod, 'is_visible')}
                            className={`p-1.5 rounded-brand ${
                              prod.is_visible
                                ? 'text-emerald-700 hover:bg-emerald-50'
                                : 'text-[#8C7565] hover:bg-stone-100'
                            }`}
                            title="Hiện / Ẩn trên website"
                          >
                            {prod.is_visible ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(prod)}
                              className="p-2 text-[#8C7565] hover:text-[#241914] hover:bg-[#E9E6D8] rounded-brand transition-colors"
                              title="Nhân bản món này (Duplicate)"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(prod)}
                              className="p-2 text-[#4B2E24] hover:bg-[#E9E6D8] rounded-brand transition-colors"
                              title="Chỉnh sửa chi tiết"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(prod)}
                              className="p-2 text-red-700 hover:bg-red-50 rounded-brand transition-colors"
                              title="Xóa món"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-[#F7F5EF] border-t border-[#D5C6AD] flex items-center justify-between text-xs">
              <span className="text-[#8C7565]">
                Trang {page} / {totalPages} ({filteredProducts.length} món)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-[#D5C6AD] bg-white rounded-brand disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-[#D5C6AD] bg-white rounded-brand disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            onClick={() => setModalOpen(false)}
            className="fixed inset-0 bg-[#241914]/60 backdrop-blur-[2px]"
          />
          <div className="relative z-10 w-full max-w-2xl bg-[#F7F5EF] border border-[#D5C6AD] rounded-brand shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#E9E6D8] border-b border-[#D5C6AD] flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#241914]">
                {editingProduct
                  ? `Chỉnh sửa: ${editingProduct.name}`
                  : 'Thêm Món Đồ Uống Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#8C7565] hover:text-[#241914]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="p-6 overflow-y-auto space-y-5 flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Tên món đồ uống *
                  </label>
                  <input
                    type="text"
                    {...form.register('name', {
                      onChange: (e) => {
                        if (!editingProduct) {
                          form.setValue('slug', slugify(e.target.value));
                        }
                      },
                    })}
                    placeholder="VD: Ô Long Nướng Kem Phô Mai"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-700 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Đường dẫn Slug *
                  </label>
                  <input
                    type="text"
                    {...form.register('slug')}
                    placeholder="o-long-nuong-kem-pho-mai"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Danh mục
                  </label>
                  <select
                    {...form.register('category_id')}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Nhãn Badge (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    {...form.register('badge')}
                    placeholder="Best Seller, Signature, New..."
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    {...form.register('sort_order')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Giá gốc (VNĐ) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    {...form.register('price')}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                    Giá khuyến mãi (VNĐ - Để trống nếu không giảm)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    {...form.register('sale_price')}
                    placeholder="VD: 59000"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Mô tả hương vị & nguyên liệu *
                </label>
                <textarea
                  rows={3}
                  {...form.register('description')}
                  placeholder="Mô tả hương vị đặc trưng của thức uống..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-700 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#241914] mb-1.5">
                  Hình ảnh sản phẩm *
                </label>
                <div className="flex flex-col sm:flex-row gap-3 items-start">
                  {watchedImage && (
                    <img
                      src={watchedImage}
                      alt="Preview"
                      className="w-24 h-24 rounded-brand object-cover border border-[#D5C6AD] shrink-0 bg-white"
                    />
                  )}
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      {...form.register('image_url')}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-[#D5C6AD] rounded-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#E9E6D8] text-[#241914] hover:bg-[#D5C6AD] rounded-brand transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Chọn hoặc Tải ảnh từ Media Library</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#D5C6AD]">
                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_featured')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Món Nổi Bật (Featured)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_best_seller')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Best Seller</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_available')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Còn món</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-[#241914] cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register('is_visible')}
                    className="rounded border-[#D5C6AD] text-[#4B2E24]"
                  />
                  <span>Hiển thị trên Web</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[#D5C6AD] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border border-[#D5C6AD] text-[#241914] rounded-brand hover:bg-[#E9E6D8]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider bg-[#4B2E24] text-[#F7F5EF] hover:bg-[#241914] rounded-brand disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingProduct ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => form.setValue('image_url', url, { shouldValidate: true })}
        folder="products"
        title="Chọn ảnh cho Sản phẩm"
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xóa sản phẩm khỏi thực đơn?"
        description={`Bạn có chắc chắn muốn xóa món "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa vĩnh viễn"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
