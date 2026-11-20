import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MANAGER_USERNAME_DOMAIN = 'manager.tunn.local';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,32}$/;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'Thiếu cấu hình máy chủ Supabase.' }, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: 'Dữ liệu yêu cầu không hợp lệ.' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Chưa xác thực phiên đăng nhập.' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
    error: callerErr,
  } = await userClient.auth.getUser();

  if (callerErr || !caller) {
    return jsonResponse({ error: 'Phiên đăng nhập đã hết hạn.' }, 401);
  }

  const { data: callerProfile, error: profileErr } = await adminClient
    .from('profiles')
    .select('role, is_owner')
    .eq('id', caller.id)
    .maybeSingle();

  if (profileErr || !callerProfile || callerProfile.role !== 'admin' || !callerProfile.is_owner) {
    return jsonResponse(
      { error: 'Chỉ tài khoản Chủ sở hữu mới có quyền tạo Quản lý mới.' },
      403
    );
  }

  const fullName = String(payload.fullName || '').trim();
  const rawIdentifier = String(payload.identifier || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!fullName) {
    return jsonResponse({ error: 'Vui lòng nhập họ và tên quản lý.' }, 400);
  }

  const isEmail = rawIdentifier.includes('@');
  if (isEmail ? !EMAIL_REGEX.test(rawIdentifier) : !USERNAME_REGEX.test(rawIdentifier)) {
    return jsonResponse(
      {
        error:
          'Tên đăng nhập chỉ gồm 3-32 ký tự (chữ, số, dấu chấm, gạch dưới, gạch ngang) hoặc là Email hợp lệ.',
      },
      400
    );
  }

  if (password.length < 12) {
    return jsonResponse({ error: 'Mật khẩu cần tối thiểu 12 ký tự.' }, 400);
  }

  const emailForAuth = isEmail
    ? rawIdentifier
    : `${rawIdentifier}@${MANAGER_USERNAME_DOMAIN}`;
  const usernameValue = isEmail ? null : rawIdentifier;

  if (usernameValue) {
    const { data: existingUsername } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('username', usernameValue)
      .maybeSingle();
    if (existingUsername) {
      return jsonResponse(
        { error: 'Tên đăng nhập này đã được sử dụng.' },
        409
      );
    }
  }

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: emailForAuth,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      created_by_owner: 'true',
      assigned_role: 'admin',
      username: usernameValue || undefined,
    },
  });

  if (createErr || !created.user) {
    const msg = createErr?.message || '';
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
      return jsonResponse(
        { error: 'Tên đăng nhập hoặc Email này đã được sử dụng.' },
        409
      );
    }
    return jsonResponse(
      { error: msg || 'Không thể tạo tài khoản Quản lý mới.' },
      400
    );
  }

  const { error: upsertErr } = await adminClient.from('profiles').upsert({
    id: created.user.id,
    email: emailForAuth,
    username: usernameValue,
    full_name: fullName,
    role: 'admin',
    is_owner: false,
  });

  if (upsertErr) {
    return jsonResponse(
      { error: 'Đã tạo tài khoản nhưng chưa lưu được hồ sơ phân quyền.' },
      500
    );
  }

  return jsonResponse({
    ok: true,
    userId: created.user.id,
    email: emailForAuth,
    displayIdentifier: rawIdentifier,
  });
});
