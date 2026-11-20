import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MANAGER_USERNAME_DOMAIN = 'manager.tunn.local';
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

  const username = String(payload.username || '').trim().toLowerCase();
  const password = String(payload.password || '');

  if (!username || username.includes('@') || !USERNAME_REGEX.test(username) || !password) {
    return jsonResponse({ error: 'Invalid login credentials' }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Resolve username -> internal auth email entirely server-side (never returned to client)
  let resolvedEmail = `${username}@${MANAGER_USERNAME_DOMAIN}`;

  const { data: byUsername } = await adminClient
    .from('profiles')
    .select('email, role')
    .ilike('username', username)
    .maybeSingle();

  if (byUsername?.email) {
    resolvedEmail = byUsername.email;
  } else if (username === 'admin') {
    const { data: ownerProfile } = await adminClient
      .from('profiles')
      .select('email')
      .eq('role', 'admin')
      .eq('is_owner', true)
      .maybeSingle();
    if (ownerProfile?.email) {
      resolvedEmail = ownerProfile.email;
    }
  }

  // 2. Authenticate directly on the server with anon client
  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signInData, error: signInErr } = await authClient.auth.signInWithPassword({
    email: resolvedEmail,
    password,
  });

  if (signInErr || !signInData.session || !signInData.user) {
    return jsonResponse(
      { error: signInErr?.message || 'Invalid login credentials' },
      401
    );
  }

  // 3. Enforce Admin role check before returning session tokens
  const { data: profileRow } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', signInData.user.id)
    .maybeSingle();

  if (profileRow && profileRow.role !== 'admin') {
    return jsonResponse({ error: 'ACCOUNT_LOCKED' }, 403);
  }

  return jsonResponse({
    session: {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    },
  });
});
