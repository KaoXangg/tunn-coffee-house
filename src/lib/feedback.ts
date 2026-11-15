import { supabase, isSupabaseConfigured } from './supabase';

export interface TableFeedbackRecord {
  id: string;
  table_number: string | null;
  rating: number;
  tags: string[];
  comment: string;
  created_at: string;
}

const LOCAL_FEEDBACK_KEY = 'tunn_table_feedback_v1';
const FEEDBACK_COOLDOWN_KEY = 'tunn_table_feedback_last_ts';

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

export async function submitTableFeedback(input: {
  tableNumber?: string | null;
  rating: number;
  tags: string[];
  comment: string;
}): Promise<{ error: string | null }> {
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
    rating: cleanRating,
    tags: cleanTags,
    comment: cleanComment,
    created_at: new Date().toISOString(),
  };

  writeLocalFeedback([localRecord, ...readLocalFeedback()]);

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
