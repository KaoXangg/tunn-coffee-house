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

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomHex(byteLength: number): string {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomTwoDigitCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(10 + (arr[0] % 90));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Thiếu cấu hình máy chủ Supabase.' }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Dữ liệu yêu cầu không hợp lệ.' }, 400);
  }

  const action = String(payload.action || '');

  // Periodic cleanup of expired rows (> 10 minutes old) to keep table tiny
  await adminClient
    .from('admin_qr_sessions')
    .delete()
    .lt('expires_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

  if (action === 'create') {
    const deviceLabel = String(payload.deviceLabel || 'Trình duyệt Web').slice(0, 80);
    const sessionSecret = randomHex(24);
    const secretHash = await sha256Hex(sessionSecret);
    const verificationCode = randomTwoDigitCode();
    const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();

    const { data, error } = await adminClient
      .from('admin_qr_sessions')
      .insert({
        session_secret: secretHash,
        verification_code: verificationCode,
        device_label: deviceLabel,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select('id, verification_code, expires_at')
      .single();

    if (error || !data) {
      return jsonResponse({ error: 'Không thể tạo phiên mã QR.' }, 500);
    }

    return jsonResponse({
      sessionId: data.id,
      sessionSecret,
      verificationCode: data.verification_code,
      expiresAt: data.expires_at,
    });
  }

  if (action === 'poll') {
    const sessionId = String(payload.sessionId || '').trim();
    const sessionSecret = String(payload.sessionSecret || '').trim();
    if (!sessionId || !sessionSecret) {
      return jsonResponse({ error: 'Thiếu thông tin phiên QR.' }, 400);
    }

    const { data: row, error } = await adminClient
      .from('admin_qr_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !row) {
      return jsonResponse({ status: 'expired' });
    }

    const secretHash = await sha256Hex(sessionSecret);
    if (secretHash !== row.session_secret) {
      return jsonResponse({ error: 'Mã phiên không hợp lệ.' }, 403);
    }

    if (new Date(row.expires_at).getTime() <= Date.now() && row.status === 'pending') {
      await adminClient
        .from('admin_qr_sessions')
        .update({ status: 'expired' })
        .eq('id', sessionId);
      return jsonResponse({ status: 'expired' });
    }

    if (row.status === 'approved' && row.otp_token && row.approved_email) {
      const otpToken = row.otp_token;
      const email = row.approved_email;
      await adminClient
        .from('admin_qr_sessions')
        .update({ status: 'consumed', otp_token: null })
        .eq('id', sessionId);

      return jsonResponse({
        status: 'approved',
        email,
        otpToken,
      });
    }

    return jsonResponse({ status: row.status });
  }

  if (action === 'inspect' || action === 'approve' || action === 'reject') {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ') || !anonKey) {
      return jsonResponse({ error: 'Thiết bị chưa đăng nhập Admin.' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();

    if (userErr || !user || !user.email) {
      return jsonResponse({ error: 'Phiên đăng nhập trên thiết bị này đã hết hạn.' }, 401);
    }

    const { data: profile, error: profileErr } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr || !profile || profile.role !== 'admin') {
      return jsonResponse({ error: 'Tài khoản này không có quyền duyệt đăng nhập.' }, 403);
    }

    const sessionId = String(payload.sessionId || '').trim();
    if (!sessionId) {
      return jsonResponse({ error: 'Thiếu mã phiên QR.' }, 400);
    }

    const { data: row } = await adminClient
      .from('admin_qr_sessions')
      .select('id, verification_code, device_label, status, expires_at')
      .eq('id', sessionId)
      .maybeSingle();

    if (!row) {
      return jsonResponse({ error: 'Mã QR không tồn tại hoặc đã hết hạn.' }, 404);
    }

    if (new Date(row.expires_at).getTime() <= Date.now() || row.status !== 'pending') {
      return jsonResponse({ error: 'Mã QR đã hết hạn hoặc đã được sử dụng.' }, 410);
    }

    if (action === 'inspect') {
      return jsonResponse({
        sessionId: row.id,
        verificationCode: row.verification_code,
        deviceLabel: row.device_label,
        expiresAt: row.expires_at,
        approverEmail: user.email,
      });
    }

    if (action === 'reject') {
      await adminClient
        .from('admin_qr_sessions')
        .update({ status: 'rejected', approved_by: user.id })
        .eq('id', sessionId)
        .eq('status', 'pending');
      return jsonResponse({ ok: true, status: 'rejected' });
    }

    // Generate single-use email OTP via Supabase Admin Auth API
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });

    const emailOtp = linkData?.properties?.email_otp;
    if (linkErr || !emailOtp) {
      return jsonResponse({ error: 'Không thể tạo mã xác thực đăng nhập.' }, 500);
    }

    const { error: updateErr } = await adminClient
      .from('admin_qr_sessions')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_email: user.email,
        otp_token: emailOtp,
      })
      .eq('id', sessionId)
      .eq('status', 'pending');

    if (updateErr) {
      return jsonResponse({ error: 'Không thể hoàn tất duyệt đăng nhập.' }, 500);
    }

    return jsonResponse({ ok: true, status: 'approved' });
  }

  return jsonResponse({ error: 'Hành động không hợp lệ.' }, 400);
});
