import { create } from 'zustand';
import { Platform, NativeModules } from 'react-native';
import { es, en } from '../i18n/translations';

const getDeviceLocale = () => {
  try {
    let locale = 'es';
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'es';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier || 'es';
    }
    return locale.startsWith('en') ? 'en' : 'es';
  } catch {
    return 'es';
  }
};

const translations = { es, en };

export const useLanguageStore = create((set, get) => ({
  locale: getDeviceLocale(),
  t: translations[getDeviceLocale()],

  setLocale: (locale) => {
    set({
      locale,
      t: translations[locale] || translations.es,
    });
  },

  toggleLanguage: () => {
    const current = get().locale;
    const next = current === 'es' ? 'en' : 'es';
    set({
      locale: next,
      t: translations[next],
    });
  },
}));
