import { FC, memo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/store/authStore';
import { SettingItem } from '@/components/molecules/SettingItem';
import { SettingSection } from '@/components/molecules/SettingSection';
import { haptics } from '@/utils/haptics';
import { useToastStore } from '@/store/toastStore';

interface AccountSectionProps {
    onChangePasswordPress: () => void;
}

export const AccountSection: FC<AccountSectionProps> = memo(({ onChangePasswordPress }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useAuthStore();
    const toast = useToastStore();

    return (
        <>
            {/* Guest Sign In Section */}
            {user?.isAnonymous && (
                <SettingSection title={t('settings.sections.signIn', 'Sign In')}>
                    <SettingItem
                        icon="log-in-outline"
                        label={t('settings.account.signIn', 'Sign In / Sign Up')}
                        value={t('settings.account.unlockFeatures', 'Unlock all features')}
                        onPress={() => {
                            haptics.selection();
                            router.push('/login');
                        }}
                    />
                </SettingSection>
            )}

            {/* Account Section */}
            <SettingSection title={t('settings.sections.account')}>
                <SettingItem
                    icon="mail-outline"
                    label={t('settings.account.email')}
                    value={user?.email || t('settings.account.notSet')}
                    hasChevron={false}
                />
                {!user?.isAnonymous && (
                    <SettingItem
                        icon="key-outline"
                        label={t('settings.account.changePassword')}
                        onPress={() => {
                            haptics.selection();
                            if (!user?.email) {
                                toast.actions.error('No email associated with this account.');
                                return;
                            }
                            onChangePasswordPress();
                        }}
                    />
                )}
            </SettingSection>
        </>
    );
});

AccountSection.displayName = 'AccountSection';
