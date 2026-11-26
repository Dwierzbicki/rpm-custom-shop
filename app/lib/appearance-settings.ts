export type AppearanceSettings={logoLaserEnabled:boolean};
export const DEFAULT_APPEARANCE_SETTINGS:AppearanceSettings={logoLaserEnabled:false};
export function validAppearanceSettings(value:unknown):value is AppearanceSettings{
 return typeof value==='object'&&value!==null&&typeof (value as AppearanceSettings).logoLaserEnabled==='boolean';
}
