import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function canonicalizeGmail(rawEmail: string): string {
  const [localRaw, domainRaw] = rawEmail.trim().toLowerCase().split('@');
  if (!localRaw || !domainRaw) return rawEmail.trim().toLowerCase();
  const domain = domainRaw === 'googlemail.com' ? 'gmail.com' : domainRaw;
  if (domain === 'gmail.com') {
    const baseLocal = localRaw.split('+')[0].replace(/\./g, '');
    return `${baseLocal}@${domain}`;
  }
  return `${localRaw}@${domain}`;
}

function validateGmailFormat(rawEmail: string): {
  valid: boolean;
  normalizedEmail: string;
  canonicalEmail: string;
  reason?: string;
} {
  const email = rawEmail.trim().toLowerCase();
  if (!email) {
    return { valid: false, normalizedEmail: '', canonicalEmail: '', reason: 'Vui lòng nhập Gmail của bạn.' };
  }
  if (email.length > 120) {
    return { valid: false, normalizedEmail: email, canonicalEmail: email, reason: 'Địa chỉ Gmail quá dài.' };
  }
  const gmailRegex = /^[a-z0-9][a-z0-9.+]{4,60}@(gmail\.com|googlemail\.com)$/;
  if (!gmailRegex.test(email)) {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: email,
      reason: 'Vui lòng nhập đúng định dạng Gmail (ví dụ: tenban@gmail.com).',
    };
  }
  const [localPart] = email.split('@');
  if (localPart.includes('..') || localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      valid: false,
      normalizedEmail: email,
      canonicalEmail: email,
      reason: 'Địa chỉ Gmail không hợp lệ (dấu chấm không đúng vị trí).',
    };
  }
  return {
    valid: true,
    normalizedEmail: email,
    canonicalEmail: canonicalizeGmail(email),
  };
}

async function verifyMx(domain: string): Promise<'mx_verified' | 'mx_invalid' | 'format_only'> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    if (!res.ok) return 'format_only';
    const data = await res.json();
    if (data && data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0) {
      return 'mx_verified';
    }
    return 'mx_invalid';
  } catch {
    return 'format_only';
  }
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = await req.json();
    const {
      turnstileToken,
      tableNumber,
      customerName,
      customerEmail,
      honeypot,
      rating,
      tags,
      comment,
    } = payload ?? {};

    // 1. Verify Cloudflare Turnstile token server-side
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY') || '';
    if (!turnstileSecret) {
      return jsonResponse({ error: 'Server chưa cấu hình TURNSTILE_SECRET_KEY.' }, 500);
    }
    if (!turnstileToken || typeof turnstileToken !== 'string' || !turnstileToken.trim()) {
      return jsonResponse({ error: 'Vui lòng xác minh bảo mật Turnstile trước khi gửi.' }, 400);
    }

    const clientIp =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '';
    const userAgent = req.headers.get('user-agent') || '';

    const formData = new FormData();
    formData.append('secret', turnstileSecret);
    formData.append('response', turnstileToken.trim());
    if (clientIp) formData.append('remoteip', clientIp);

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const verifyData = await verifyRes.json();
    if (!verifyData?.success) {
      return jsonResponse(
        { error: 'Xác minh Turnstile không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.' },
        400
      );
    }

    // 2. Re-validate all feedback fields server-side (same strictness as client)
    if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
      return jsonResponse({ error: 'Yêu cầu không hợp lệ.' }, 400);
    }

    const cleanName = typeof customerName === 'string' ? customerName.trim().slice(0, 80) : '';
    if (cleanName.length < 2 || /^\d+$/.test(cleanName)) {
      return jsonResponse({ error: 'Vui lòng nhập tên của bạn (ít nhất 2 ký tự).' }, 400);
    }

    const gmailCheck = validateGmailFormat(typeof customerEmail === 'string' ? customerEmail : '');
    if (!gmailCheck.valid) {
      return jsonResponse({ error: gmailCheck.reason || 'Gmail không hợp lệ.' }, 400);
    }

    const domain = gmailCheck.normalizedEmail.split('@')[1] || 'gmail.com';
    const mxStatus = await verifyMx(domain);
    if (mxStatus === 'mx_invalid') {
      return jsonResponse(
        { error: 'Tên miền Gmail không tồn tại hoặc không thể nhận thư.' },
        400
      );
    }

    const parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return jsonResponse({ error: 'Điểm đánh giá phải từ 1 đến 5 sao.' }, 400);
    }
    const cleanRating = Math.min(5, Math.max(1, Math.round(parsedRating)));
    const cleanTable =
      typeof tableNumber === 'string' && tableNumber.trim().length > 0
        ? tableNumber.trim().slice(0, 20)
        : null;
    const cleanComment = typeof comment === 'string' ? comment.trim().slice(0, 300) : '';
    const cleanTags = Array.isArray(tags)
      ? tags.filter((t): t is string => typeof t === 'string').slice(0, 6)
      : [];

    // 3. Insert using service_role key with server-computed client_fingerprint
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Thiếu cấu hình Supabase trong Edge Function.' }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const clientFingerprint =
      clientIp || userAgent ? await sha256Hex(`${clientIp}|${userAgent}`) : null;

    const { error } = await adminClient.from('table_feedback').insert({
      table_number: cleanTable,
      customer_name: cleanName,
      customer_email: gmailCheck.normalizedEmail,
      email_verified_status: mxStatus,
      rating: cleanRating,
      tags: cleanTags,
      comment: cleanComment,
      client_fingerprint: clientFingerprint,
    });

    if (error) {
      if (error.code === '23505') {
        return jsonResponse({ ok: true, rateLimited: true }, 200);
      }
      if (error.code === 'P0001' || error.message?.includes('EMAIL_RATE_LIMIT')) {
        return jsonResponse(
          { error: 'Gmail này vừa gửi đánh giá trong 24 giờ qua. Cảm ơn bạn đã góp ý!' },
          400
        );
      }
      console.error('Edge submit-feedback DB error:', error);
      return jsonResponse(
        { error: 'Không thể gửi đánh giá lúc này. Vui lòng thử lại sau ít phút.' },
        500
      );
    }

    return jsonResponse({ ok: true, rateLimited: false }, 200);
  } catch (err) {
    console.error('Edge submit-feedback exception:', err);
    return jsonResponse({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }
});
