import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useThemeStore } from '@/store/themeStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useToastStore } from '@/store/toastStore';
import { SettingItem } from '@/components/molecules/SettingItem';
import { SettingSection } from '@/components/molecules/SettingSection';
import { SettingToggle } from '@/components/molecules/SettingToggle';
import { haptics } from '@/utils/haptics';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
] as const;

interface PreferencesSectionProps {
    notificationsEnabled: boolean;
    onNotificationToggle: (value: boolean) => void;
    onThemePress: () => void;
    onLanguagePress: () => void;
}

export const PreferencesSection: FC<PreferencesSectionProps> = memo(({
    notificationsEnabled,
    onNotificationToggle,
    onThemePress,
    onLanguagePress,
}) => {
    const { t, i18n } = useTranslation();
    const toast = useToastStore();
    const { mode: themeMode } = useThemeStore();
    const { fontSize } = useReadingPrefsStore();

    const themeModeLabel = t(`appearance.${themeMode}`);
    const currentLanguage = LANGUAGES.find(l => l.code === (i18n.language || 'en').split('-')[0])?.label || 'English';

    return (
        <SettingSection title={t('settings.sections.preferences')}>
            <SettingItem
                icon="color-palette-outline"
                label={t('settings.preferences.theme')}
                value={themeModeLabel}
                onPress={() => {
                    haptics.selection();
                    onThemePress();
                }}
            />
            <SettingItem
                icon="language-outline"
                label={t('settings.preferences.language')}
                value={currentLanguage}
                onPress={() => {
                    haptics.selection();
                    onLanguagePress();
                }}
            />
            <SettingItem
                icon="text-outline"
                label={t('settings.preferences.fontSize')}
                value={`${fontSize}pt`}
                onPress={() => {
                    haptics.selection();
                    toast.actions.info(t('settings.preferences.fontSizeInstruction'));
                }}
            />
            <SettingToggle
                icon="notifications-outline"
                label={t('settings.preferences.notifications')}
                value={notificationsEnabled}
                onValueChange={onNotificationToggle}
            />
        </SettingSection>
    );
});

PreferencesSection.displayName = 'PreferencesSection';
