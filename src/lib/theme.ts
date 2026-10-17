export type ThemeMode='light'|'dark'|'system';
export type ResolvedTheme='light'|'dark';
export const THEME_STORAGE_KEY='nutricarsi-theme';

/** Invalid or missing stored preferences fall back to the device's theme. */
export function parseThemeMode(value:unknown):ThemeMode{
 return value==='light'||value==='dark'||value==='system'?value:'system';
}

export function resolveTheme(mode:ThemeMode,devicePrefersDark:boolean):ResolvedTheme{
 return mode==='system'?(devicePrefersDark?'dark':'light'):mode;
}
