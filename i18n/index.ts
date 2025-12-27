import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import tr from './locales/tr.json';
import es from './locales/es.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import id from './locales/id.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ptBR from './locales/pt-BR.json';

const resources = {
    en: { translation: en },
    tr: { translation: tr },
    es: { translation: es },
    de: { translation: de },
    fr: { translation: fr },
    id: { translation: id },
    ja: { translation: ja },
    ko: { translation: ko },
    'pt-BR': { translation: ptBR },
};

const getInitialLanguage = () => {
    try {
        const locales = Localization.getLocales();
        const code = locales && locales.length > 0 ? locales[0].languageCode : 'en';
        return ['en', 'tr', 'es', 'de', 'fr', 'id', 'ja', 'ko', 'pt-BR'].includes(code as string) ? code : 'en';
    } catch {
        return 'en';
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getInitialLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

export default i18n;
