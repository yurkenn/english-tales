import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/store/authStore';
import { SettingItem } from '@/components/molecules/SettingItem';
import { SettingSection } from '@/components/molecules/SettingSection';
import { haptics } from '@/utils/haptics';

interface DangerZoneSectionProps {
    onSignOutPress: () => void;
    onDeleteAccountPress: () => void;
}

export const DangerZoneSection: FC<DangerZoneSectionProps> = memo(({
    onSignOutPress,
    onDeleteAccountPress,
}) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();

    return (
        <SettingSection title={t('settings.sections.dangerZone')} isDanger>
            <SettingItem
                icon="log-out-outline"
                label={t('settings.dangerZone.signOut')}
                isDestructive
                onPress={() => {
                    haptics.warning();
                    onSignOutPress();
                }}
            />
            {user && !user.isAnonymous && (
                <SettingItem
                    icon="trash-outline"
                    label={t('settings.dangerZone.deleteAccount')}
                    isDestructive
                    onPress={() => {
                        haptics.warning();
                        onDeleteAccountPress();
                    }}
                />
            )}
        </SettingSection>
    );
});

DangerZoneSection.displayName = 'DangerZoneSection';
