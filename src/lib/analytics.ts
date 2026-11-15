import { supabase, isSupabaseConfigured } from './supabase';

export interface CustomerEventRecord {
  id: string;
  event_type: 'product_view' | 'qr_scan';
  product_id: string | null;
  product_name: string | null;
  table_number: string | null;
  created_at: string;
}

const LOCAL_ANALYTICS_KEY = 'tunn_customer_events_v1';

function readLocalEvents(): CustomerEventRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLocalEvent(record: CustomerEventRecord) {
  try {
    const current = readLocalEvents();
    const updated = [record, ...current].slice(0, 500);
    localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }
}

export async function trackProductView(productId: string, productName: string) {
  const record: CustomerEventRecord = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    event_type: 'product_view',
    product_id: productId,
    product_name: productName,
    table_number: null,
    created_at: new Date().toISOString(),
  };

  appendLocalEvent(record);

  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('customer_events').insert({
      event_type: 'product_view',
      product_id: productId,
      product_name: productName,
    });
  } catch {
    // non-blocking if table isn't migrated yet
  }
}

export async function trackQrTableScan(tableNumber: string) {
  const cleanTable = tableNumber.trim();
  if (!cleanTable) return;

  // Deduplicate within the same browser session so page refreshes don't inflate scan counts
  const sessionKey = `tunn_qr_tracked_${cleanTable}`;
  if (sessionStorage.getItem(sessionKey)) return;
  sessionStorage.setItem(sessionKey, '1');

  const record: CustomerEventRecord = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    event_type: 'qr_scan',
    product_id: null,
    product_name: null,
    table_number: cleanTable,
    created_at: new Date().toISOString(),
  };

  appendLocalEvent(record);

  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('customer_events').insert({
      event_type: 'qr_scan',
      table_number: cleanTable,
    });
  } catch {
    // non-blocking
  }
}

export async function fetchCustomerEvents(): Promise<{
  events: CustomerEventRecord[];
  source: 'supabase' | 'local';
}> {
  const localEvents = readLocalEvents();

  if (!isSupabaseConfigured) {
    return { events: localEvents, source: 'local' };
  }

  try {
    const { data, error } = await supabase
      .from('customer_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error || !data) {
      return { events: localEvents, source: 'local' };
    }

    return {
      events: data as CustomerEventRecord[],
      source: 'supabase',
    };
  } catch {
    return { events: localEvents, source: 'local' };
  }
}
