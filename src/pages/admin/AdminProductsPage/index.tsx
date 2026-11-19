import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
    Star,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Zap,
  LayoutList,
  DollarSign,
  Printer,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useSiteData } from '../../../contexts/SiteDataContext';
import { useToast } from '../../../contexts/ToastContext';
import { formatVND, slugify } from '../../../lib/utils';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Skeleton } from '../../../components/common/Skeleton';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../../../types/database';

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

export type ProductFormValues = z.infer<typeof productSchema>;

const ITEMS_PER_PAGE = 8;

export const AdminProductsPage: React.FC = () => {
  const { products, categories, settings, loading, isLiveDatabase, refreshAll, logAdminActivity } =
    useSiteData();
  const showSkeleton = loading && !isLiveDatabase;
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

  // Duplicate Product (Open Create Modal pre-filled with existing product data)
  const handleDuplicateProduct = (prod: Product) => {
    const newName = `${prod.name} (Mới)`;
    const newSlug = `${slugify(prod.name)}-moi-${Math.random().toString(36).slice(2, 5)}`;

    setEditingProduct(null);
    form.reset({
      name: newName,
      slug: newSlug,
      description: prod.description,
      image_url: prod.image_url,
      price: prod.price,
      sale_price: prod.sale_price ?? '',
      category_id: prod.category_id || '',
      badge: prod.badge || '',
      is_featured: false,
      is_best_seller: false,
      is_available: prod.is_available,
      is_visible: prod.is_visible,
      sort_order: products.length + 1,
    });
    setModalOpen(true);
    toast.info(
      'Đã sao chép thông tin món',
      'Bạn chỉ cần đổi tên, giá hoặc hình ảnh rồi bấm Lưu.'
    );
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
    } catch (err: unknown) {
      toast.error('Lỗi cập nhật giá', err instanceof Error ? err.message : undefined);
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
    } catch (err: unknown) {
      toast.error('Lỗi lưu sản phẩm', err instanceof Error ? err.message : 'Không thể lưu vào database');
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
    } catch (err: unknown) {
      toast.error('Lỗi khi xóa sản phẩm', err instanceof Error ? err.message : undefined);
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
    } catch (err: unknown) {
      toast.error('Lỗi thao tác hàng loạt', err instanceof Error ? err.message : undefined);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkAdjustPrice = async () => {
    const rawVal = Number(bulkPriceInput);
    const discount = Math.abs(rawVal);
    if (!bulkPriceInput.trim() || isNaN(discount) || discount <= 0) {
      toast.error('Vui lòng nhập mức giảm giá hợp lệ (VD: 10 cho 10% hoặc 5000 cho 5.000đ)');
      return;
    }
    if (selectedIds.length === 0 || !isSupabaseConfigured) return;

    setBulkProcessing(true);
    try {
      const targets = products.filter((p) => selectedIds.includes(p.id));
      for (const prod of targets) {
        const basePrice = Number(prod.price);
        const computedSale =
          bulkPriceUnit === 'percent'
            ? Math.max(1000, Math.round((basePrice * (1 - discount / 100)) / 1000) * 1000)
            : Math.max(1000, basePrice - discount);
        const nextSalePrice = computedSale < basePrice ? computedSale : null;

        const { error } = await supabase
          .from('products')
          .update({ sale_price: nextSalePrice })
          .eq('id', prod.id);
        if (error) throw error;
      }

      await logAdminActivity(
        `Áp dụng giảm giá hàng loạt (-${discount}${
          bulkPriceUnit === 'percent' ? '%' : 'đ'
        })`,
        'products',
        `${targets.length} sản phẩm`
      );
      await refreshAll();
      toast.success(
        `Đã giảm giá ${targets.length} món (Giá gốc vẫn được giữ nguyên)`
      );
      setBulkPriceInput('');
      setSelectedIds([]);
    } catch (err: unknown) {
      toast.error('Lỗi cập nhật giá hàng loạt', err instanceof Error ? err.message : undefined);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleRestoreOriginalPrices = async (targetIds?: string[]) => {
    if (!isSupabaseConfigured) return;
    const idsToRestore =
      targetIds && targetIds.length > 0
        ? targetIds
        : products
            .filter((p) => p.sale_price !== null && Number(p.sale_price) > 0)
            .map((p) => p.id);

    if (idsToRestore.length === 0) {
      toast.info('Tất cả các món đã ở giá gốc.');
      return;
    }

    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ sale_price: null })
        .in('id', idsToRestore);
      if (error) throw error;

      await logAdminActivity(
        'Khôi phục về giá gốc',
        'products',
        `${idsToRestore.length} sản phẩm`
      );
      await refreshAll();
      toast.success(`Đã đưa ${idsToRestore.length} món về lại giá gốc!`);
      setSelectedIds([]);
    } catch (err: unknown) {
      toast.error('Không thể khôi phục giá gốc', err instanceof Error ? err.message : undefined);
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
          <h1 className="font-serif text-3xl font-semibold text-coffee-dark">
            Quản Lý Thực Đơn & Sản Phẩm
          </h1>
          <p className="text-sm text-coffee-muted mt-1">
            Chạm vào giá tiền để sửa nhanh tại chỗ, bấm Nhân bản để tạo món tương tự hoặc bật Chế độ Tại Quầy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Counter Quick Mode Switch */}
          <div className="inline-flex rounded-brand border border-coffee-beige bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-brand transition-colors ${
                viewMode === 'full'
                  ? 'bg-coffee text-ivory-light'
                  : 'text-coffee-dark hover:bg-ivory'
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
                  ? 'bg-coffee text-ivory-light'
                  : 'text-coffee-dark hover:bg-ivory'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Chế Độ Tại Quầy (1-Chạm)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintMenuA4}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider bg-white border border-coffee-beige text-coffee-dark hover:bg-ivory rounded-brand transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>In Thực Đơn A4</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider bg-coffee text-ivory-light hover:bg-coffee-dark rounded-brand transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Món Mới</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white border border-coffee-beige rounded-brand p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-coffee-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm nhanh tên món để báo hết / sửa giá..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-ivory-light border border-coffee-beige rounded-brand focus:outline-none focus:border-coffee"
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
            className="w-full px-3 py-2 text-xs font-medium bg-ivory-light border border-coffee-beige rounded-brand"
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
              setFilterStatus(e.target.value as Parameters<typeof setFilterStatus>[0]);
              setPage(1);
            }}
            aria-label="Lọc theo trạng thái"
            className="w-full px-3 py-2 text-xs font-medium bg-ivory-light border border-coffee-beige rounded-brand"
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
            onChange={(e) => setSortBy(e.target.value as Parameters<typeof setSortBy>[0])}
            aria-label="Sắp xếp"
            className="w-full px-3 py-2 text-xs font-medium bg-ivory-light border border-coffee-beige rounded-brand"
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
          <div className="p-3.5 bg-ivory border border-coffee-beige rounded-brand flex items-center justify-between text-xs text-coffee-dark">
            <span className="inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-coffee shrink-0" />
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
                    ? 'bg-white border-coffee-beige'
                    : 'bg-red-50/60 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className={`w-14 h-14 rounded-brand object-cover border border-coffee-beige shrink-0 ${
                      !prod.is_available ? 'grayscale opacity-70' : ''
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-base font-bold text-coffee-dark truncate">
                      {prod.name}
                    </p>
                    <p className="text-xs font-semibold text-coffee mt-0.5">
                      {formatVND(prod.sale_price || prod.price)}
                    </p>
                    <p className="text-[10px] text-coffee-muted">
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
          {/* Quick Store-wide Selection & Restore Original Price Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allIds = filteredProducts.map((p) => p.id);
                  const allSelected =
                    allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
                  setSelectedIds(allSelected ? [] : allIds);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold bg-white border border-coffee-beige text-coffee-dark hover:bg-ivory rounded-brand transition-colors"
              >
                <span>
                  {filteredProducts.length > 0 &&
                  filteredProducts.every((p) => selectedIds.includes(p.id))
                    ? `Bỏ chọn tất cả (${filteredProducts.length} món)`
                    : `Chọn tất cả món trong cửa hàng (${filteredProducts.length} món)`}
                </span>
              </button>
            </div>

            {products.some((p) => p.sale_price !== null && Number(p.sale_price) > 0) && (
              <button
                type="button"
                disabled={bulkProcessing}
                onClick={() => handleRestoreOriginalPrices()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-brand transition-colors disabled:opacity-50"
              >
                <span>
                  Về giá gốc tất cả ({products.filter((p) => p.sale_price && Number(p.sale_price) > 0).length} món đang giảm)
                </span>
              </button>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="p-3.5 bg-coffee-dark text-ivory-light rounded-brand flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="font-semibold">
                  Đã chọn {selectedIds.length} món
                </span>
                {selectedIds.length < filteredProducts.length && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds(filteredProducts.map((p) => p.id))}
                    className="text-amber-300 hover:text-white underline font-medium"
                  >
                    Chọn hết {filteredProducts.length} món toàn quán
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-coffee-beige hover:text-white underline"
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
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-coffee hover:bg-[#5c392d] text-white rounded-brand disabled:opacity-50"
                >
                  Ẩn trên Web
                </button>
                <button
                  type="button"
                  disabled={bulkProcessing}
                  onClick={() =>
                    handleBulkUpdateField('is_visible', true, 'Hiện hàng loạt')
                  }
                  className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-coffee hover:bg-[#5c392d] text-white rounded-brand disabled:opacity-50"
                >
                  Hiện trên Web
                </button>

                <div className="flex flex-wrap items-center gap-1.5 pl-2 border-l border-coffee">
                  <input
                    type="number"
                    value={bulkPriceInput}
                    onChange={(e) => setBulkPriceInput(e.target.value)}
                    placeholder="Giảm 10 hoặc 5000"
                    className="w-32 px-2.5 py-1 text-xs bg-white text-coffee-dark rounded-brand"
                  />
                  <select
                    value={bulkPriceUnit}
                    onChange={(e) => setBulkPriceUnit(e.target.value as 'percent' | 'vnd')}
                    className="px-2 py-1 text-xs bg-white text-coffee-dark rounded-brand"
                  >
                    <option value="percent">%</option>
                    <option value="vnd">VNĐ</option>
                  </select>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={handleBulkAdjustPrice}
                    className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-coffee-beige text-coffee-dark hover:bg-white rounded-brand disabled:opacity-50"
                  >
                    Giảm giá
                  </button>
                  <button
                    type="button"
                    disabled={bulkProcessing}
                    onClick={() => handleRestoreOriginalPrices(selectedIds)}
                    className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider bg-amber-200 text-coffee-dark hover:bg-white rounded-brand disabled:opacity-50"
                  >
                    Về giá gốc
                  </button>
                </div>
              </div>
            </div>
          )}

        <div className="bg-white border border-coffee-beige rounded-brand overflow-hidden">
          {paginatedProducts.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-serif text-xl text-coffee-dark">
                Không tìm thấy sản phẩm nào
              </p>
              <p className="text-xs text-coffee-muted mt-1">
                Hãy thử bộ lọc khác hoặc nhấn &ldquo;Thêm Món Mới&rdquo;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory border-b border-coffee-beige text-xs text-coffee-dark font-semibold">
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          paginatedProducts.length > 0 &&
                          paginatedProducts.every((p) => selectedIds.includes(p.id))
                        }
                        onChange={() => toggleSelectPage(paginatedProducts)}
                        aria-label="Chọn tất cả món trong trang"
                        className="rounded border-coffee-beige text-coffee"
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
                <tbody className="divide-y divide-ivory text-sm">
                  {showSkeleton
                    ? Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={`skeleton-${idx}`}>
                          <td className="py-3.5 pl-4 pr-2">
                            <Skeleton className="w-4 h-4" />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-11 h-11 rounded-brand shrink-0" />
                              <div className="space-y-1.5">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="py-3.5 px-4">
                            <Skeleton className="h-4 w-20" />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Skeleton className="h-6 w-6 mx-auto" />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Skeleton className="h-6 w-12 mx-auto" />
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Skeleton className="h-6 w-12 mx-auto" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Skeleton className="h-7 w-16 ml-auto" />
                          </td>
                        </tr>
                      ))
                    : paginatedProducts.map((prod) => {
                    const isEditingPrice = inlinePriceId === prod.id;
                    const isChecked = selectedIds.includes(prod.id);
                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-ivory-light/60 transition-colors ${
                          isChecked ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectProduct(prod.id)}
                            aria-label={`Chọn ${prod.name}`}
                            className="rounded border-coffee-beige text-coffee"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-12 h-12 rounded-brand object-cover border border-coffee-beige shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-coffee-dark truncate">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-coffee-muted">
                                  #{prod.sort_order}
                                </span>
                                {prod.badge && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-ivory text-coffee rounded font-semibold">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-coffee-dark whitespace-nowrap">
                          {getCategoryName(prod.category_id)}
                        </td>

                        {/* Inline Price Editor Cell */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isEditingPrice ? (
                            <div className="flex items-center gap-1.5 bg-ivory-light p-1.5 rounded-brand border border-coffee">
                              <div className="space-y-1">
                                <input
                                  type="number"
                                  step="1000"
                                  value={inlinePriceVal}
                                  onChange={(e) => setInlinePriceVal(e.target.value)}
                                  placeholder="Giá gốc"
                                  className="w-24 px-2 py-1 text-xs bg-white border border-coffee-beige rounded"
                                />
                                <input
                                  type="number"
                                  step="1000"
                                  value={inlineSalePriceVal}
                                  onChange={(e) =>
                                    setInlineSalePriceVal(e.target.value)
                                  }
                                  placeholder="Giá KM (tùy chọn)"
                                  className="w-24 px-2 py-1 text-xs bg-white border border-coffee-beige rounded block"
                                />
                              </div>
                              <button
                                type="button"
                                disabled={savingInline}
                                onClick={() => handleSaveInlinePrice(prod)}
                                className="p-1.5 bg-coffee text-white rounded hover:bg-coffee-dark"
                                title="Lưu giá"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlinePriceId(null)}
                                className="p-1.5 text-coffee-muted hover:text-coffee-dark"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startInlinePriceEdit(prod)}
                                className="group text-left hover:bg-ivory/70 px-2 py-1 -mx-2 rounded transition-colors"
                                title="Nhấn để sửa nhanh giá tiền"
                              >
                                <span className="font-semibold text-coffee inline-flex items-center gap-1">
                                  {formatVND(prod.sale_price || prod.price)}
                                  <DollarSign className="w-3 h-3 opacity-0 group-hover:opacity-100 text-coffee-muted" />
                                </span>
                                {prod.sale_price && prod.sale_price < prod.price && (
                                  <span className="block text-[11px] text-coffee-muted line-through">
                                    {formatVND(prod.price)}
                                  </span>
                                )}
                              </button>
                              {prod.sale_price && prod.sale_price < prod.price && (
                                <button
                                  type="button"
                                  disabled={bulkProcessing}
                                  onClick={() => handleRestoreOriginalPrices([prod.id])}
                                  className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 rounded transition-colors"
                                  title="Đưa món này về lại giá gốc"
                                >
                                  Về giá gốc
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleQuickField(prod, 'is_featured')}
                            className={`p-1.5 rounded-brand transition-colors ${
                              prod.is_featured
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-coffee-muted hover:bg-ivory'
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
                                : 'text-coffee-muted hover:bg-stone-100'
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
                              className="p-2 text-coffee-muted hover:text-coffee-dark hover:bg-ivory rounded-brand transition-colors"
                              title="Nhân bản món này (Duplicate)"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(prod)}
                              className="p-2 text-coffee hover:bg-ivory rounded-brand transition-colors"
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
            <div className="px-4 py-3 bg-ivory-light border-t border-coffee-beige flex items-center justify-between text-xs">
              <span className="text-coffee-muted">
                Trang {page} / {totalPages} ({filteredProducts.length} món)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-coffee-beige bg-white rounded-brand disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-coffee-beige bg-white rounded-brand disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}


      <ProductFormModal
        open={modalOpen}
        editingProduct={editingProduct}
        categories={categories}
        form={form}
        watchedImage={watchedImage}
        saving={saving}
        mediaPickerOpen={mediaPickerOpen}
        onOpenMediaPicker={setMediaPickerOpen}
        onSubmit={onSubmit}
        onClose={() => setModalOpen(false)}
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
