import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { broadcastLiveSync, subscribeLiveSync } from '../lib/liveSync';
import {
  PRESET_SEASONAL_THEMES,
  SEASONAL_PREVIEW_SESSION_KEY,
  loadLocalSeasonalThemes,
  saveLocalSeasonalThemes,
  resolveEffectiveSeasonalTheme,
} from '../lib/seasonalThemes';
import type { SeasonalTheme } from '../types/seasonalTheme';

interface SeasonalThemeContextType {
  themes: SeasonalTheme[];
  activeTheme: SeasonalTheme | null;
  previewTheme: SeasonalTheme | null;
  effectiveTheme: SeasonalTheme | null;
  isPreviewing: boolean;
  loading: boolean;
  refreshThemes: () => Promise<void>;
  activateTheme: (id: string) => Promise<{ error: string | null }>;
  deactivateAllThemes: () => Promise<{ error: string | null }>;
  saveTheme: (theme: SeasonalTheme) => Promise<{ error: string | null }>;
  duplicateTheme: (theme: SeasonalTheme) => Promise<{ error: string | null; created?: SeasonalTheme }>;
  deleteTheme: (id: string) => Promise<{ error: string | null }>;
  startPreview: (id: string) => void;
  exitPreview: () => void;
}

const SeasonalThemeContext = createContext<SeasonalThemeContextType | undefined>(undefined);

export const SeasonalThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themes, setThemes] = useState<SeasonalTheme[]>(() => loadLocalSeasonalThemes());
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('preview_theme');
      if (fromUrl) {
        sessionStorage.setItem(SEASONAL_PREVIEW_SESSION_KEY, fromUrl);
        return fromUrl;
      }
      return sessionStorage.getItem(SEASONAL_PREVIEW_SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(() => new Date());

  // Re-evaluate time-based schedules once per minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const refreshThemes = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('seasonal_themes')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (!error && data) {
        if (data.length === 0) {
          // Table exists but has not been seeded yet — keep presets locally until Admin saves/seeds
          const local = loadLocalSeasonalThemes();
          setThemes(local);
        } else {
          // Merge any missing presets just in case
          const dbIds = new Set(data.map((d: SeasonalTheme) => d.id));
          const missingPresets = PRESET_SEASONAL_THEMES.filter((p) => !dbIds.has(p.id));
          const merged = [...(data as SeasonalTheme[]), ...missingPresets];
          setThemes(merged);
          saveLocalSeasonalThemes(merged);
        }
      }
    } catch {
      // Fallback to localStorage seamlessly
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshThemes();
  }, [refreshThemes]);

  // Realtime + Cross-Tab + Visibility + Fallback Polling sync across customer & admin tabs
  useEffect(() => {
    let debounceTimer: number | null = null;
    const scheduleRefresh = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        refreshThemes();
      }, 220);
    };

    const unsubLocal = subscribeLiveSync((scope) => {
      if (scope === 'themes' || scope === 'all') {
        scheduleRefresh();
      }
    });

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };
    const onFocus = () => scheduleRefresh();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    const pollInterval = isSupabaseConfigured
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') {
            refreshThemes();
          }
        }, 12_000)
      : null;

    const channel = isSupabaseConfigured
      ? supabase
          .channel('tunn-seasonal-themes-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'seasonal_themes' }, () => {
            scheduleRefresh();
          })
          .subscribe()
      : null;

    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      unsubLocal();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      if (pollInterval) window.clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [refreshThemes]);

  const activeTheme = useMemo(() => resolveEffectiveSeasonalTheme(themes, now), [themes, now]);

  const previewTheme = useMemo(
    () => (previewThemeId ? themes.find((t) => t.id === previewThemeId) || null : null),
    [themes, previewThemeId]
  );

  const effectiveTheme = previewTheme || activeTheme;
  const isPreviewing = Boolean(previewTheme);

  const syncPresetsIfNeeded = async (currentThemes: SeasonalTheme[]) => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('seasonal_themes').upsert(
        currentThemes.map((t) => ({
          ...t,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    } catch {
      // Ignore if table not migrated yet
    }
  };

  const activateTheme = async (id: string): Promise<{ error: string | null }> => {
    const ts = new Date().toISOString();
    const updated = themes.map((t) => ({
      ...t,
      is_active: t.id === id,
      updated_at: t.id === id || t.is_active ? ts : t.updated_at,
    }));

    setThemes(updated);
    saveLocalSeasonalThemes(updated);
    broadcastLiveSync('themes');

    if (!isSupabaseConfigured) return { error: null };

    try {
      // Ensure presets exist in DB then activate target
      await syncPresetsIfNeeded(updated);
      const { error } = await supabase
        .from('seasonal_themes')
        .update({ is_active: true, updated_at: ts })
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Không thể kích hoạt chủ đề.' };
    }
  };

  const deactivateAllThemes = async (): Promise<{ error: string | null }> => {
    const ts = new Date().toISOString();
    const updated = themes.map((t) => ({
      ...t,
      is_active: false,
      schedule_start: null,
      schedule_end: null,
      updated_at: ts,
    }));

    setThemes(updated);
    saveLocalSeasonalThemes(updated);
    broadcastLiveSync('themes');

    if (!isSupabaseConfigured) return { error: null };

    try {
      const { error } = await supabase
        .from('seasonal_themes')
        .update({ is_active: false, schedule_start: null, schedule_end: null, updated_at: ts })
        .neq('id', '');
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Lỗi hủy kích hoạt.' };
    }
  };

  const saveTheme = async (theme: SeasonalTheme): Promise<{ error: string | null }> => {
    const ts = new Date().toISOString();
    const nextTheme: SeasonalTheme = { ...theme, updated_at: ts };
    const exists = themes.some((t) => t.id === nextTheme.id);
    const updated = exists
      ? themes.map((t) => (t.id === nextTheme.id ? nextTheme : t))
      : [nextTheme, ...themes];

    setThemes(updated);
    saveLocalSeasonalThemes(updated);
    broadcastLiveSync('themes');

    if (!isSupabaseConfigured) return { error: null };

    try {
      const { error } = await supabase
        .from('seasonal_themes')
        .upsert(nextTheme, { onConflict: 'id' });
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Lỗi lưu chủ đề.' };
    }
  };

  const duplicateTheme = async (
    theme: SeasonalTheme
  ): Promise<{ error: string | null; created?: SeasonalTheme }> => {
    const ts = new Date().toISOString();
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const copy: SeasonalTheme = {
      ...theme,
      id,
      key: id,
      name: `${theme.name} (Bản sao)`,
      category: 'custom',
      is_preset: false,
      is_active: false,
      schedule_start: null,
      schedule_end: null,
      created_at: ts,
      updated_at: ts,
    };

    const res = await saveTheme(copy);
    return { ...res, created: copy };
  };

  const deleteTheme = async (id: string): Promise<{ error: string | null }> => {
    const target = themes.find((t) => t.id === id);
    if (target?.is_preset) {
      return { error: 'Không thể xóa chủ đề mặc định của hệ thống.' };
    }

    const updated = themes.filter((t) => t.id !== id);
    setThemes(updated);
    saveLocalSeasonalThemes(updated);

    if (previewThemeId === id) {
      exitPreview();
    }

    if (!isSupabaseConfigured) return { error: null };

    try {
      const { error } = await supabase.from('seasonal_themes').delete().eq('id', id);
      return { error: error ? error.message : null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Lỗi xóa chủ đề.' };
    }
  };

  const startPreview = useCallback((id: string) => {
    setPreviewThemeId(id);
    try {
      sessionStorage.setItem(SEASONAL_PREVIEW_SESSION_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const exitPreview = useCallback(() => {
    setPreviewThemeId(null);
    try {
      sessionStorage.removeItem(SEASONAL_PREVIEW_SESSION_KEY);
      const url = new URL(window.location.href);
      if (url.searchParams.has('preview_theme')) {
        url.searchParams.delete('preview_theme');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <SeasonalThemeContext.Provider
      value={{
        themes,
        activeTheme,
        previewTheme,
        effectiveTheme,
        isPreviewing,
        loading,
        refreshThemes,
        activateTheme,
        deactivateAllThemes,
        saveTheme,
        duplicateTheme,
        deleteTheme,
        startPreview,
        exitPreview,
      }}
    >
      {children}
    </SeasonalThemeContext.Provider>
  );
};

export function useSeasonalTheme() {
  const ctx = useContext(SeasonalThemeContext);
  if (!ctx) throw new Error('useSeasonalTheme must be used within SeasonalThemeProvider');
  return ctx;
}
