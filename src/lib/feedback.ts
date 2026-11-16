import { supabase, isSupabaseConfigured } from './supabase';

export interface TableFeedbackRecord {
  id: string;
  table_number: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  email_verified_status?: string | null;
  rating: number;
  tags: string[];
  comment: string;
  created_at: string;
}

export interface PublicReviewRecord {
  id: string;
  customer_name: string;
  table_number: string | null;
  rating: number;
  tags: string[];
  comment: string;
  created_at: string;
}

const LOCAL_FEEDBACK_KEY = 'tunn_table_feedback_v1';
const FEEDBACK_COOLDOWN_KEY = 'tunn_table_feedback_last_ts';
const FEEDBACK_EMAIL_HISTORY_KEY = 'tunn_table_feedback_emails_v1';
const EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h per canonical Gmail

const BLOCKED_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'test123',
  'test1234',
  'asdf',
  'asdfgh',
  'asdfghjkl',
  'qwerty',
  'qwertyuiop',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  'abcdef',
  'spam',
  'fake',
  'fakeemail',
  'noreply',
  'no-reply',
  'admin',
  'user',
  'guest',
  'demo',
]);

export interface GmailCheckResult {
  valid: boolean;
  normalizedEmail: string;
  canonicalEmail: string;
  status: 'mx_verified' | 'format_verified' | 'invalid';
  reason?: string;
}

export function normalizeCanonicalGmail(email: string): string {
  const clean = email.trim().toLowerCase();
  const [local = '', domain = ''] = clean.split('@');
  const baseLocal = local.split('+')[0].replace(/\./g, '');
  const normalizedDomain = domain === 'googlemail.com' ? 'gmail.com' : domain;
  return `${baseLocal}@${normalizedDomain}`;
}

export function validateGmailFormat(rawEmail: string): {
  valid: boolean;
  normalizedEmail: string;
  canonicalEmail: string;
  reason?: string;
} {
  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    return {
      valid: false,
      normalizedEmail: '',
      canonicalEmail: '',
      reason: 'Vui lòng nhập địa chỉ Gmail của bạn.',
    };
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: '',
      reason: 'Địa chỉ Gmail không đúng định dạng.',
    };
  }

  const [localPart, domain] = parts;
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: '',
      reason: 'Vui lòng nhập địa chỉ @gmail.com hợp lệ.',
    };
  }

  const [usernameOnly] = localPart.split('+');
  if (usernameOnly.length < 6 || usernameOnly.length > 30) {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: '',
      reason: 'Tên Gmail phải từ 6 đến 30 ký tự trước @gmail.com.',
    };
  }

  if (
    !/^[a-z0-9.]+$/.test(usernameOnly) ||
    usernameOnly.startsWith('.') ||
    usernameOnly.endsWith('.') ||
    usernameOnly.includes('..')
  ) {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: '',
      reason: 'Tên Gmail chứa ký tự hoặc dấu chấm không hợp lệ.',
    };
  }

  const stripped = usernameOnly.replace(/\./g, '');
  if (
    BLOCKED_LOCAL_PARTS.has(stripped) ||
    /^(.)\1+$/.test(stripped) ||
    /^\d+$/.test(stripped)
  ) {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: '',
      reason: 'Vui lòng nhập địa chỉ Gmail đang hoạt động.',
    };
  }

  const canonical = normalizeCanonicalGmail(email);
  return {
    valid: true,
    normalizedEmail: email,
    canonicalEmail: canonical,
  };
}

export async function verifyGmailWithMx(rawEmail: string): Promise<GmailCheckResult> {
  const formatCheck = validateGmailFormat(rawEmail);
  if (!formatCheck.valid) {
    return {
      valid: false,
      normalizedEmail: formatCheck.normalizedEmail,
      canonicalEmail: formatCheck.canonicalEmail,
      status: 'invalid',
      reason: formatCheck.reason,
    };
  }

  const domain = formatCheck.normalizedEmail.split('@')[1] || 'gmail.com';
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: controller.signal }
    );
    window.clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      const hasGoogleMx =
        json?.Status === 0 &&
        Array.isArray(json?.Answer) &&
        json.Answer.some(
          (ans: { data?: string }) =>
            typeof ans.data === 'string' && ans.data.toLowerCase().includes('google')
        );
      if (hasGoogleMx) {
        return {
          valid: true,
          normalizedEmail: formatCheck.normalizedEmail,
          canonicalEmail: formatCheck.canonicalEmail,
          status: 'mx_verified',
        };
      }
    }
  } catch {
    // Offline or DNS API blocked: keep strict format verification
  }

  return {
    valid: true,
    normalizedEmail: formatCheck.normalizedEmail,
    canonicalEmail: formatCheck.canonicalEmail,
    status: 'format_verified',
  };
}

function readLocalFeedback(): TableFeedbackRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalFeedback(items: TableFeedbackRecord[]) {
  try {
    localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    // ignore quota errors
  }
}

function hasRecentEmailSubmission(canonicalEmail: string): boolean {
  try {
    const raw = localStorage.getItem(FEEDBACK_EMAIL_HISTORY_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, number>;
    const lastTs = map[canonicalEmail];
    return typeof lastTs === 'number' && Date.now() - lastTs < EMAIL_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function recordEmailSubmission(canonicalEmail: string) {
  try {
    const raw = localStorage.getItem(FEEDBACK_EMAIL_HISTORY_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[canonicalEmail] = Date.now();
    localStorage.setItem(FEEDBACK_EMAIL_HISTORY_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export async function submitTableFeedback(input: {
  tableNumber?: string | null;
  customerName: string;
  customerEmail: string;
  honeypot?: string;
  rating: number;
  tags: string[];
  comment: string;
}): Promise<{ error: string | null }> {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { error: 'Yêu cầu không hợp lệ.' };
  }

  const cleanName = input.customerName.trim().slice(0, 80);
  if (cleanName.length < 2 || /^\d+$/.test(cleanName)) {
    return { error: 'Vui lòng nhập tên của bạn (ít nhất 2 ký tự).' };
  }

  const gmailCheck = await verifyGmailWithMx(input.customerEmail);
  if (!gmailCheck.valid) {
    return { error: gmailCheck.reason || 'Gmail không hợp lệ.' };
  }

  if (hasRecentEmailSubmission(gmailCheck.canonicalEmail)) {
    return {
      error: 'Gmail này vừa gửi đánh giá trong 24 giờ qua. Cảm ơn bạn đã góp ý!',
    };
  }

  const cleanRating = Math.min(5, Math.max(1, Math.round(input.rating)));
  const cleanTable = input.tableNumber ? input.tableNumber.trim().slice(0, 20) : null;
  const cleanComment = input.comment.trim().slice(0, 300);
  const cleanTags = input.tags.slice(0, 6);

  try {
    const lastTs = Number(sessionStorage.getItem(FEEDBACK_COOLDOWN_KEY) || 0);
    if (Date.now() - lastTs < 20_000) {
      return { error: 'Bạn vừa gửi đánh giá xong. Vui lòng đợi vài giây trước khi gửi tiếp.' };
    }
  } catch {
    // ignore storage errors
  }

  const localRecord: TableFeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    table_number: cleanTable,
    customer_name: cleanName,
    customer_email: gmailCheck.normalizedEmail,
    email_verified_status: gmailCheck.status,
    rating: cleanRating,
    tags: cleanTags,
    comment: cleanComment,
    created_at: new Date().toISOString(),
  };

  writeLocalFeedback([localRecord, ...readLocalFeedback()]);
  recordEmailSubmission(gmailCheck.canonicalEmail);

  try {
    sessionStorage.setItem(FEEDBACK_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase.from('table_feedback').insert({
      table_number: cleanTable,
      customer_name: cleanName,
      customer_email: gmailCheck.normalizedEmail,
      email_verified_status: gmailCheck.status,
      rating: cleanRating,
      tags: cleanTags,
      comment: cleanComment,
    });
    if (error) {
      console.warn('Supabase table_feedback insert warning:', error.message);
    }
    return { error: null };
  } catch {
    return { error: null };
  }
}

export async function fetchTableFeedback(): Promise<{
  items: TableFeedbackRecord[];
  source: 'supabase' | 'local';
}> {
  const local = readLocalFeedback();
  if (!isSupabaseConfigured) {
    return { items: local, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('table_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return { items: local, source: 'local' };
    }

    return { items: data as TableFeedbackRecord[], source: 'supabase' };
  } catch {
    return { items: local, source: 'local' };
  }
}

export async function fetchPublicPositiveReviews(): Promise<PublicReviewRecord[]> {
  const localPositive: PublicReviewRecord[] = readLocalFeedback()
    .filter((item) => item.rating >= 4 && (item.comment?.trim() || (item.tags && item.tags.length > 0)))
    .map((item) => ({
      id: item.id,
      customer_name: item.customer_name?.trim() || 'Khách TUNN',
      table_number: item.table_number ?? null,
      rating: item.rating,
      tags: item.tags || [],
      comment: item.comment || '',
      created_at: item.created_at,
    }));

  if (!isSupabaseConfigured) {
    return localPositive;
  }

  try {
    const { data, error } = await supabase
      .from('public_positive_reviews')
      .select('id, customer_name, table_number, rating, tags, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(24);

    if (error || !data) {
      return localPositive;
    }

    return data as PublicReviewRecord[];
  } catch {
    return localPositive;
  }
}

export async function deleteTableFeedback(id: string): Promise<{ error: string | null }> {
  writeLocalFeedback(readLocalFeedback().filter((item) => item.id !== id));

  if (!isSupabaseConfigured || id.startsWith('fb_')) {
    return { error: null };
  }

  try {
    const { error } = await supabase.from('table_feedback').delete().eq('id', id);
    return { error: error ? error.message : null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Không thể xóa đánh giá.' };
  }
}
