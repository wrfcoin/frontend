// I18nConfig - Internationalization context, provider, and translation hook
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Supported locales
// ---------------------------------------------------------------------------
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'ja'];

export const LOCALE_META = {
  en: { flag: '\u{1F1FA}\u{1F1F8}', native: 'English', english: 'English', completion: 100 },
  es: { flag: '\u{1F1EA}\u{1F1F8}', native: 'Espa\u00f1ol', english: 'Spanish', completion: 94 },
  fr: { flag: '\u{1F1EB}\u{1F1F7}', native: 'Fran\u00e7ais', english: 'French', completion: 91 },
  de: { flag: '\u{1F1E9}\u{1F1EA}', native: 'Deutsch', english: 'German', completion: 87 },
  ja: { flag: '\u{1F1EF}\u{1F1F5}', native: '\u65E5\u672C\u8A9E', english: 'Japanese', completion: 82 },
};

// ---------------------------------------------------------------------------
// Translation dictionaries (~30 keys per language)
// ---------------------------------------------------------------------------
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.wallet': 'Wallet',
    'nav.explorer': 'Explorer',
    'nav.weather': 'Weather',
    'nav.mining': 'Mining',
    'nav.governance': 'Governance',
    'nav.settings': 'Settings',
    // Actions
    'action.submit': 'Submit',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.delete': 'Delete',
    'action.connect': 'Connect',
    'action.disconnect': 'Disconnect',
    'action.confirm': 'Confirm',
    'action.search': 'Search',
    // Status
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.pending': 'Pending',
    'status.active': 'Active',
    'status.connected': 'Connected',
    'status.syncing': 'Syncing',
    // Weather
    'weather.temperature': 'Temperature',
    'weather.humidity': 'Humidity',
    'weather.pressure': 'Pressure',
    'weather.windSpeed': 'Wind Speed',
    'weather.rainfall': 'Rainfall',
    'weather.forecast': 'Forecast',
    'weather.station': 'Weather Station',
    // Dashboard
    'dashboard.welcome': 'Welcome to WRFCoin',
    'dashboard.overview': 'Platform Overview',
    'dashboard.recentActivity': 'Recent Activity',
  },
  es: {
    'nav.dashboard': 'Panel',
    'nav.wallet': 'Billetera',
    'nav.explorer': 'Explorador',
    'nav.weather': 'Clima',
    'nav.mining': 'Miner\u00eda',
    'nav.governance': 'Gobernanza',
    'nav.settings': 'Configuraci\u00f3n',
    'action.submit': 'Enviar',
    'action.cancel': 'Cancelar',
    'action.save': 'Guardar',
    'action.delete': 'Eliminar',
    'action.connect': 'Conectar',
    'action.disconnect': 'Desconectar',
    'action.confirm': 'Confirmar',
    'action.search': 'Buscar',
    'status.online': 'En l\u00ednea',
    'status.offline': 'Fuera de l\u00ednea',
    'status.pending': 'Pendiente',
    'status.active': 'Activo',
    'status.connected': 'Conectado',
    'status.syncing': 'Sincronizando',
    'weather.temperature': 'Temperatura',
    'weather.humidity': 'Humedad',
    'weather.pressure': 'Presi\u00f3n',
    'weather.windSpeed': 'Velocidad del viento',
    'weather.rainfall': 'Precipitaci\u00f3n',
    'weather.forecast': 'Pron\u00f3stico',
    'weather.station': 'Estaci\u00f3n meteorol\u00f3gica',
    'dashboard.welcome': 'Bienvenido a WRFCoin',
    'dashboard.overview': 'Vista general de la plataforma',
    'dashboard.recentActivity': 'Actividad reciente',
  },
  fr: {
    'nav.dashboard': 'Tableau de bord',
    'nav.wallet': 'Portefeuille',
    'nav.explorer': 'Explorateur',
    'nav.weather': 'M\u00e9t\u00e9o',
    'nav.mining': 'Minage',
    'nav.governance': 'Gouvernance',
    'nav.settings': 'Param\u00e8tres',
    'action.submit': 'Soumettre',
    'action.cancel': 'Annuler',
    'action.save': 'Enregistrer',
    'action.delete': 'Supprimer',
    'action.connect': 'Connecter',
    'action.disconnect': 'D\u00e9connecter',
    'action.confirm': 'Confirmer',
    'action.search': 'Rechercher',
    'status.online': 'En ligne',
    'status.offline': 'Hors ligne',
    'status.pending': 'En attente',
    'status.active': 'Actif',
    'status.connected': 'Connect\u00e9',
    'status.syncing': 'Synchronisation',
    'weather.temperature': 'Temp\u00e9rature',
    'weather.humidity': 'Humidit\u00e9',
    'weather.pressure': 'Pression',
    'weather.windSpeed': 'Vitesse du vent',
    'weather.rainfall': 'Pr\u00e9cipitations',
    'weather.forecast': 'Pr\u00e9visions',
    'weather.station': 'Station m\u00e9t\u00e9orologique',
    'dashboard.welcome': 'Bienvenue sur WRFCoin',
    'dashboard.overview': 'Aper\u00e7u de la plateforme',
    'dashboard.recentActivity': 'Activit\u00e9 r\u00e9cente',
  },
  de: {
    'nav.dashboard': '\u00dcbersicht',
    'nav.wallet': 'Geldb\u00f6rse',
    'nav.explorer': 'Explorer',
    'nav.weather': 'Wetter',
    'nav.mining': 'Sch\u00fcrfen',
    'nav.governance': 'Verwaltung',
    'nav.settings': 'Einstellungen',
    'action.submit': 'Absenden',
    'action.cancel': 'Abbrechen',
    'action.save': 'Speichern',
    'action.delete': 'L\u00f6schen',
    'action.connect': 'Verbinden',
    'action.disconnect': 'Trennen',
    'action.confirm': 'Best\u00e4tigen',
    'action.search': 'Suchen',
    'status.online': 'Online',
    'status.offline': 'Offline',
    'status.pending': 'Ausstehend',
    'status.active': 'Aktiv',
    'status.connected': 'Verbunden',
    'status.syncing': 'Synchronisierung',
    'weather.temperature': 'Temperatur',
    'weather.humidity': 'Luftfeuchtigkeit',
    'weather.pressure': 'Luftdruck',
    'weather.windSpeed': 'Windgeschwindigkeit',
    'weather.rainfall': 'Niederschlag',
    'weather.forecast': 'Vorhersage',
    'weather.station': 'Wetterstation',
    'dashboard.welcome': 'Willkommen bei WRFCoin',
    'dashboard.overview': 'Plattform\u00fcbersicht',
    'dashboard.recentActivity': 'Letzte Aktivit\u00e4t',
  },
  ja: {
    'nav.dashboard': '\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9',
    'nav.wallet': '\u30A6\u30A9\u30EC\u30C3\u30C8',
    'nav.explorer': '\u30A8\u30AF\u30B9\u30D7\u30ED\u30FC\u30E9\u30FC',
    'nav.weather': '\u5929\u6C17',
    'nav.mining': '\u30DE\u30A4\u30CB\u30F3\u30B0',
    'nav.governance': '\u30AC\u30D0\u30CA\u30F3\u30B9',
    'nav.settings': '\u8A2D\u5B9A',
    'action.submit': '\u9001\u4FE1',
    'action.cancel': '\u30AD\u30E3\u30F3\u30BB\u30EB',
    'action.save': '\u4FDD\u5B58',
    'action.delete': '\u524A\u9664',
    'action.connect': '\u63A5\u7D9A',
    'action.disconnect': '\u5207\u65AD',
    'action.confirm': '\u78BA\u8A8D',
    'action.search': '\u691C\u7D22',
    'status.online': '\u30AA\u30F3\u30E9\u30A4\u30F3',
    'status.offline': '\u30AA\u30D5\u30E9\u30A4\u30F3',
    'status.pending': '\u4FDD\u7559\u4E2D',
    'status.active': '\u30A2\u30AF\u30C6\u30A3\u30D6',
    'status.connected': '\u63A5\u7D9A\u6E08\u307F',
    'status.syncing': '\u540C\u671F\u4E2D',
    'weather.temperature': '\u6E29\u5EA6',
    'weather.humidity': '\u6E7F\u5EA6',
    'weather.pressure': '\u6C17\u5727',
    'weather.windSpeed': '\u98A8\u901F',
    'weather.rainfall': '\u964D\u6C34\u91CF',
    'weather.forecast': '\u4E88\u5831',
    'weather.station': '\u6C17\u8C61\u89B3\u6E2C\u6240',
    'dashboard.welcome': 'WRFCoin\u3078\u3088\u3046\u3053\u305D',
    'dashboard.overview': '\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u6982\u8981',
    'dashboard.recentActivity': '\u6700\u8FD1\u306E\u30A2\u30AF\u30C6\u30A3\u30D3\u30C6\u30A3',
  },
};

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
interface I18nContextValue {
  locale: string;
  setLocale: (locale: string) => void;
  t: (key: string) => string;
  translations: typeof translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------
interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = 'en',
}) => {
  const [locale, setLocale] = useState(defaultLocale);

  const t = useCallback(
    (key: string): string => {
      const dict = translations[locale as keyof typeof translations];
      if (dict && key in dict) {
        return dict[key as keyof typeof dict];
      }
      // Fallback to English, then to the raw key
      const enDict = translations.en;
      if (key in enDict) {
        return enDict[key as keyof typeof enDict];
      }
      return key;
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, translations }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};

export default I18nProvider;
