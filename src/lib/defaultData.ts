import type {
  SiteSettings,
  Category,
  Product,
  Promotion,
  GalleryItem,
  PageSection,
  HeroSectionContent,
  AboutSectionContent,
} from '../types/database';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 1,
  brand_name: 'TUNN Coffee House',
  site_title: 'TUNN Coffee House — Your Daily Ritual, Made Extraordinary',
  slogan: 'Your Daily Ritual, Made Extraordinary.',
  logo_url: '/logo.png',
  favicon_url: '/logo.png',

  // Appearance & Design System
  primary_color: '#4B2E24',      // Coffee Brown
  secondary_bg_color: '#E9E6D8', // Warm Ivory
  primary_bg_color: '#F7F5EF',   // Cream White
  text_primary_color: '#241914', // Dark Espresso
  text_muted_color: '#8C7565',   // Muted Brown
  accent_color: '#D5C6AD',       // Warm Beige
  heading_font: 'Cormorant Garamond',
  body_font: 'Plus Jakarta Sans',
  border_radius: '0.25rem',
  button_style: 'editorial',
  theme_mode: 'light',

  // Navigation & Header
  nav_items: [
    { label: 'Trang chủ', href: '#hero' },
    { label: 'Câu chuyện', href: '#about' },
    { label: 'Nổi bật', href: '#featured' },
    { label: 'Thực đơn', href: '#menu' },
    { label: 'Ưu đãi', href: '#promotions' },
    { label: 'Không gian', href: '#gallery' },
    { label: 'Liên hệ', href: '#contact' },
  ],
  header_cta_label: 'Khám phá Menu',
  header_cta_href: '#menu',

  // Contact Settings (Strictly no fake phone or address per prompt requirement)
  store_name: 'TUNN Coffee House',
  address: '',
  hotline: '',
  email: '',
  opening_hours: '07:30 — 22:30 (Mỗi ngày)',
  google_maps_url: '',
  google_maps_embed: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  order_url: '#menu',

  // Footer
  footer_description:
    'Nơi hội tụ của những hạt cà phê tuyển chọn, lá trà nguyên bản và nghệ thuật pha chế thủ công trong không gian tối giản ấm áp.',
  copyright_text: '© 2026 TUNN Coffee House. Crafted with warmth & precision.',

  // SEO
  seo_title: 'TUNN Coffee House — Trà Sữa, Cà Phê Đặc Sản & Matcha Thủ Công',
  seo_description:
    'Khám phá hương vị trà sữa nguyên lá, trà trái cây tươi, cà phê rang mộc và matcha chuẩn Nhật tại TUNN Coffee House.',
  seo_keywords:
    'TUNN Coffee House, trà sữa, cà phê, matcha, trà trái cây, quán cà phê đẹp',
  og_image_url: '/logo.png',

  updated_at: new Date().toISOString(),
};

export const DEFAULT_HERO_CONTENT: HeroSectionContent = {
  badge: 'ARTISANAL ROASTERY & TEA BAR',
  headline: 'Một chút ngọt ngào,\ncho ngày thêm trọn vẹn.',
  subheadline:
    'Your Daily Ritual, Made Extraordinary — Nơi hương cà phê rang mộc quyện cùng vị trà nguyên lá thượng hạng trong không gian tĩnh lặng đầy cảm hứng.',
  primary_cta_label: 'Khám phá Thực đơn',
  primary_cta_href: '#menu',
  secondary_cta_label: 'Câu chuyện Thương hiệu',
  secondary_cta_href: '#about',
  hero_image_url:
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1400&q=85',
  secondary_image_url:
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80',
  background_color: '#E9E6D8',
  text_color: '#241914',
  overlay_opacity: 0.15,
  alignment: 'left',
  featured_note_title: 'Ô Long Nướng Kem Phô Mai Muối Biển',
  featured_note_subtitle: 'Hương khói nhẹ · Hậu vị ngọt thanh',
};

export const DEFAULT_ABOUT_CONTENT: AboutSectionContent = {
  eyebrow: 'THE ART OF SLOWNESS',
  headline: 'Từ những đồi trà sương mù đến tách cà phê thủ công mỗi sớm mai.',
  lead_paragraph:
    'Tại TUNN Coffee House, chúng tôi tin rằng một thức uống ngon không chỉ đến từ công thức chuẩn xác, mà bắt đầu từ sự trân trọng từng nguyên liệu tự nhiên và khoảnh khắc thưởng thức của bạn.',
  story_body:
    'Mỗi mẻ hạt Arabica Cầu Đất được rang ở ngưỡng vừa phải để giữ trọn hương hoa quả tự nhiên. Mỗi lá trà Ô Long và lục trà Shan Tuyết được ủ lạnh nhiều giờ liền để chiết xuất vị ngọt hậu thanh tao mà không hề chát gắt. Kết hợp cùng sữa tươi thanh trùng và nguyên liệu thủ công làm mới mỗi ngày.',
  main_image_url:
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
  secondary_image_url:
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80',
  quote:
    '“Chúng tôi không chỉ pha chế đồ uống, chúng tôi kiến tạo một khoảng lặng ấm áp giữa nhịp sống vội vã.”',
  pillars: [
    {
      number: '01',
      title: 'Nguyên Liệu Tuyển Chọn',
      description:
        '100% trà nguyên lá vùng cao, hạt cà phê Arabica & Fine Robusta thu hoạch chín đỏ, bột Matcha Uji Nhật Bản chuẩn lễ trà.',
    },
    {
      number: '02',
      title: 'Pha Chế Thủ Công',
      description:
        'Kiểm soát nhiệt độ nước, thời gian ủ trà và áp suất chiết xuất espresso riêng biệt cho từng dòng đồ uống.',
    },
    {
      number: '03',
      title: 'Không Gian Tối Giản Ấm Áp',
      description:
        'Thiết kế lấy cảm hứng từ sắc kem ngà, gỗ trầm và ánh sáng tự nhiên, mang lại cảm giác thư thái cho mọi cuộc trò chuyện.',
    },
  ],
};

export const DEFAULT_PAGE_SECTIONS: PageSection[] = [
  {
    id: 'sec-hero',
    section_key: 'hero',
    title: 'Your Daily Ritual, Made Extraordinary.',
    subtitle: 'Một chút ngọt ngào, cho ngày thêm trọn vẹn.',
    is_enabled: true,
    sort_order: 1,
    content: DEFAULT_HERO_CONTENT,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-about',
    section_key: 'about',
    title: 'Triết Lý Của Sự Tĩnh Lặng & Nguyên Bản',
    subtitle: 'Câu chuyện TUNN Coffee House',
    is_enabled: true,
    sort_order: 2,
    content: DEFAULT_ABOUT_CONTENT,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-featured',
    section_key: 'featured',
    title: 'Tác Phẩm Nổi Bật',
    subtitle: 'Được yêu thích nhất tại TUNN Coffee House',
    is_enabled: true,
    sort_order: 3,
    content: {
      eyebrow: 'CURATED SIGNATURES',
      description:
        'Những sáng tạo mang đậm dấu ấn riêng của TUNN — cân bằng hoàn hảo giữa hương thơm nguyên bản và cấu trúc vị giác tinh tế.',
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-menu',
    section_key: 'menu',
    title: 'Thực Đơn Tinh Tuyển',
    subtitle: 'Khám phá trọn vẹn hương vị trà và cà phê thủ công',
    is_enabled: true,
    sort_order: 4,
    content: {
      eyebrow: 'SEASONAL & ARTISANAL MENU',
      note: 'Tất cả đồ uống có thể tùy chỉnh mức đường và đá theo khẩu vị riêng của quý khách.',
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-promotions',
    section_key: 'promotions',
    title: 'Ưu Đãi & Mùa Vị Mới',
    subtitle: 'Những chương trình đặc biệt dành riêng cho bạn',
    is_enabled: true,
    sort_order: 5,
    content: {
      eyebrow: 'LIMITED EDITIONS & OFFERS',
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-gallery',
    section_key: 'gallery',
    title: 'Không Gian & Khoảnh Khắc',
    subtitle: 'Góc nhìn nghệ thuật tại TUNN Coffee House',
    is_enabled: true,
    sort_order: 6,
    content: {
      eyebrow: 'VISUAL JOURNAL',
      description:
        'Từng góc nhỏ, từng vệt nắng chiều và những tách đồ uống được chăm chút tỉ mỉ mỗi ngày.',
    },
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sec-contact',
    section_key: 'contact',
    title: 'Ghé Thăm TUNN Coffee House',
    subtitle: 'Chúng tôi luôn sẵn sàng đón tiếp bạn với một tách trà ấm',
    is_enabled: true,
    sort_order: 7,
    content: {
      eyebrow: 'VISIT & CONNECT',
      invitation_note:
        'Thông tin liên hệ được đồng bộ trực tiếp từ hệ thống quản trị Admin CMS.',
    },
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Trà Sữa Nguyên Lá',
    slug: 'tra-sua',
    description: 'Trà ủ chậm kết hợp sữa tươi thanh trùng và kem béo nhẹ.',
    image_url:
      'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Trà Trái Cây Tươi',
    slug: 'tra-trai-cay',
    description:
      'Sự giao thoa sảng khoái giữa nền trà thanh mát và trái cây nhiệt đới tươi mới.',
    image_url:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Cà Phê Thủ Công',
    slug: 'ca-phe',
    description: 'Hạt cà phê tuyển chọn rang mộc, chiết xuất chuẩn xác.',
    image_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Matcha Uji Nhật Bản',
    slug: 'matcha',
    description: 'Bột trà xanh Uji thu hoạch vụ xuân được đánh tay truyền thống.',
    image_url:
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-5',
    name: 'Signature Sáng Tạo',
    slug: 'signature',
    description: 'Những công thức độc bản chỉ có tại TUNN Coffee House.',
    image_url:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-6',
    name: 'Seasonal Drinks',
    slug: 'seasonal-drinks',
    description: 'Bộ sưu tập thức uống giới hạn theo từng mùa trong năm.',
    image_url:
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Ô Long Nướng Kem Phô Mai Muối Biển',
    slug: 'o-long-nuong-kem-pho-mai',
    description:
      'Trà Ô Long nướng than hồng đậm hương khói nhẹ, quyện cùng lớp kem phô mai mặn dịu mịn màng như nhung.',
    image_url:
      'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80',
    price: 65000,
    sale_price: 59000,
    category_id: 'cat-1',
    badge: 'Best Seller',
    is_featured: true,
    is_best_seller: true,
    is_available: true,
    is_visible: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Trà Sữa Hồng Trà Shan Tuyết Cổ Thụ',
    slug: 'tra-sua-hong-tra-shan-tuyet',
    description:
      'Hồng trà lên men từ búp trà Shan Tuyết cổ thụ, hương mật ong rừng tự nhiên kết hợp sữa tươi thanh nhẹ.',
    image_url:
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    price: 62000,
    sale_price: null,
    category_id: 'cat-1',
    badge: 'Signature',
    is_featured: true,
    is_best_seller: false,
    is_available: true,
    is_visible: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Cold Brew Cam Vàng Quế Thanh',
    slug: 'cold-brew-cam-vang-que-thanh',
    description:
      'Cà phê Arabica ủ lạnh 18 giờ, điểm xuyết nước cam vàng tươi và hương quế trầm ấm.',
    image_url:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    price: 68000,
    sale_price: null,
    category_id: 'cat-3',
    badge: 'Signature',
    is_featured: true,
    is_best_seller: true,
    is_available: true,
    is_visible: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Matcha Uji Latte Kem Sữa Lạnh',
    slug: 'matcha-uji-latte-kem-sua',
    description:
      'Matcha Ceremonial Grade vùng Uji đánh chasen thủ công trên nền sữa yến mạch và kem lạnh béo thanh.',
    image_url:
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    price: 72000,
    sale_price: 68000,
    category_id: 'cat-4',
    badge: 'Must Try',
    is_featured: true,
    is_best_seller: true,
    is_available: true,
    is_visible: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Trà Lài Nhãn Nhục Hạt Sen Tươi',
    slug: 'tra-lai-nhan-nhuc-hat-sen',
    description:
      'Lục trà ướp hoa lài tự nhiên, kết hợp nhãn nhục lồng Hưng Yên và hạt sen bùi ngọt thanh mát.',
    image_url:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    price: 58000,
    sale_price: null,
    category_id: 'cat-2',
    badge: 'Thanh Mát',
    is_featured: true,
    is_best_seller: false,
    is_available: true,
    is_visible: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'TUNN Espresso Kem Hạt Phỉ Rang',
    slug: 'tunn-espresso-kem-hat-phi',
    description:
      'Double shot Espresso đậm đà nâng đỡ lớp kem tươi hạt phỉ rang thơm bùi và vụn cacao nguyên chất.',
    image_url:
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    price: 69000,
    sale_price: null,
    category_id: 'cat-5',
    badge: 'Độc Bản',
    is_featured: true,
    is_best_seller: true,
    is_available: true,
    is_visible: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'Trà Đào Hồng Tuyết Sơn',
    slug: 'tra-dao-hong-tuyet-son',
    description:
      'Trà Ô Long bạch đào thanh tao kết hợp miếng đào giòn ngọt và lớp foam hoa hồng nhẹ nhàng.',
    image_url:
      'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?auto=format&fit=crop&w=800&q=80',
    price: 60000,
    sale_price: null,
    category_id: 'cat-2',
    badge: '',
    is_featured: false,
    is_best_seller: false,
    is_available: true,
    is_visible: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Matcha Dừa Tươi Nướng Bến Tre',
    slug: 'matcha-dua-tuoi-nuong',
    description:
      'Sự kết hợp bất ngờ giữa vị umami của Matcha Uji và nước dừa tươi ngọt thanh điểm dừa nướng giòn.',
    image_url:
      'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=80',
    price: 69000,
    sale_price: null,
    category_id: 'cat-4',
    badge: 'New',
    is_featured: false,
    is_best_seller: false,
    is_available: true,
    is_visible: true,
    sort_order: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    name: 'Cà Phê Sữa Hạnh Nhân Rang Mộc',
    slug: 'ca-phe-sua-hanh-nhan',
    description:
      'Cà phê phin truyền thống biến tấu cùng sữa hạnh nhân thơm dịu và kem béo thực vật.',
    image_url:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    price: 55000,
    sale_price: null,
    category_id: 'cat-3',
    badge: '',
    is_featured: false,
    is_best_seller: false,
    is_available: true,
    is_visible: true,
    sort_order: 9,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    name: 'Houjicha Sữa Hạt Dẻ Mùa Thu',
    slug: 'houjicha-sua-hat-de-mua-thu',
    description:
      'Trà xanh rang Houjicha ấm áp hòa quyện sốt hạt dẻ nghiền thủ công và sữa tươi đánh bông.',
    image_url:
      'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    price: 75000,
    sale_price: 69000,
    category_id: 'cat-6',
    badge: 'Seasonal',
    is_featured: false,
    is_best_seller: false,
    is_available: true,
    is_visible: true,
    sort_order: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Bộ Sưu Tập Thu Đông — Hương Trà Nướng & Hạt Dẻ',
    subtitle: 'AUTUMN / WINTER COLLECTION',
    description:
      'Thưởng thức trọn vẹn sự ấm áp từ trà Ô Long nướng than hồng, Houjicha rang trầm và kem hạt dẻ thủ công mới ra mắt tại TUNN Coffee House.',
    banner_image_url:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=85',
    tag: 'Seasonal Collection',
    start_date: '2026-10-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    cta_label: 'Thử ngay Bộ sưu tập mới',
    cta_url: '#menu',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'promo-2',
    title: 'Morning Ritual — Ưu Đãi 15% Khung Giờ Sáng',
    subtitle: 'EVERYDAY 07:30 — 10:30',
    description:
      'Khởi đầu ngày mới tràn đầy cảm hứng với ưu đãi 15% cho toàn bộ dòng Cà Phê Thủ Công và Matcha Uji khi ghé quán mỗi buổi sáng.',
    banner_image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
    tag: 'Daily Ritual',
    start_date: '2026-01-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    cta_label: 'Xem Thực đơn Cà phê',
    cta_url: '#menu',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'Ánh nắng sớm qua khung cửa',
    caption: 'Không gian tĩnh lặng ngập tràn ánh sáng tự nhiên mỗi buổi sớm tại TUNN.',
    category: 'Không gian',
    image_url:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1000&q=85',
    aspect_ratio: 'portrait',
    is_visible: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gal-2',
    title: 'Nghệ thuật Pour Over thủ công',
    caption: 'Từng giọt cà phê chiết xuất chậm để giữ trọn tầng hương hoa quả.',
    category: 'Đồ uống',
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85',
    aspect_ratio: 'landscape',
    is_visible: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gal-3',
    title: 'Matcha Uji đánh Chasen truyền thống',
    caption: 'Bột trà xanh nghiền cối đá từ vùng Uji, Kyoto với sắc xanh ngọc bích.',
    category: 'Đồ uống',
    image_url:
      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=1000&q=85',
    aspect_ratio: 'square',
    is_visible: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gal-4',
    title: 'Góc thưởng trà tối giản',
    caption: 'Sự giao thoa giữa vật liệu gỗ trầm, gốm mộc và sắc kem ngà ấm áp.',
    category: 'Không gian',
    image_url:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=85',
    aspect_ratio: 'portrait',
    is_visible: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gal-5',
    title: 'Lá trà nguyên bản vùng cao',
    caption: 'Tuyển chọn từ những đồi trà sương mù cổ thụ trước khi ủ lạnh.',
    category: 'Thương hiệu',
    image_url:
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=85',
    aspect_ratio: 'landscape',
    is_visible: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'gal-6',
    title: 'Buổi Workshop Thưởng Trà & Cà Phê',
    caption: 'Kết nối những tâm hồn đồng điệu yêu hương vị nguyên bản cuối tuần.',
    category: 'Sự kiện',
    image_url:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=85',
    aspect_ratio: 'square',
    is_visible: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
