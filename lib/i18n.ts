export type Lang = 'ro' | 'en';

export const T: Record<string, Record<string, string>> = {
  ro: {
    searchPlaceholder: 'Caută canal...', live: 'LIVE', now: 'Acum', next: 'Urmează', favorites: 'Favorite',
    recentlyWatched: 'Vizualizate recent', recentSearches: 'Căutări recente', streak: 'Serie zilnică', install: 'Instalează aplicația',
  },
  en: {
    searchPlaceholder: 'Search channel...', live: 'LIVE', now: 'Now', next: 'Next', favorites: 'Favorites',
    recentlyWatched: 'Recently watched', recentSearches: 'Recent searches', streak: 'Daily streak', install: 'Install app',
  },
};

export const categoriesEN: Record<string, string> = {
  generale: 'General TV', stiri: 'News', sport: 'Sports', filme: 'Movies & Series',
  divertisment: 'Entertainment', documentare: 'Documentaries', copii: 'Kids & Family',
  muzica: 'Music', international: 'International', religioase: 'Religious & Culture',
};

export function f(lang: string | Record<string, string>, key: string, vars?: Record<string, string | number>): string {
  const dict = typeof lang === 'string' ? (T[lang] || T.ro) : lang;
  let s = dict[key] ?? (T.ro[key] ?? key);
  if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, String(vars[k]));
  return s;
}
