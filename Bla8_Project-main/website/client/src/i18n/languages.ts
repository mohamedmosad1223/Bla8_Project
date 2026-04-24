
export type LangCode = 'SA' | 'US' | 'FR' | 'DE' | 'ES' | 'PK';

export const RTL_LANGS: LangCode[] = ['SA', 'PK'];

export const LANGUAGES: { code: LangCode; name: string; subtitle: string; flag: string }[] = [
  { code: 'SA', name: 'العربية',  subtitle: 'ابدأ الآن',     flag: '🇸🇦' },
  { code: 'US', name: 'English',  subtitle: 'Start Now',     flag: '🇺🇸' },
  { code: 'FR', name: 'Français', subtitle: 'Commencer',     flag: '🇫🇷' },
  { code: 'DE', name: 'Deutsch',  subtitle: 'Jetzt starten', flag: '🇩🇪' },
  { code: 'ES', name: 'Español',  subtitle: 'Empezar ahora', flag: '🇪🇸' },
  { code: 'PK', name: 'اردو',    subtitle: 'شروع کریں',     flag: '🇵🇰' },
];
