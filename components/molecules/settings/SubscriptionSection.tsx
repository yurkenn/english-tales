import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SettingItem } from '@/components/molecules/SettingItem';
import { SettingSection } from '@/components/molecules/SettingSection';
import { haptics } from '@/utils/haptics';

interface SubscriptionSectionProps {
    isRestoring: boolean;
    onRestorePurchases: () => void;
}

export const SubscriptionSection: FC<SubscriptionSectionProps> = memo(({
    isRestoring,
    onRestorePurchases,
}) => {
    const { t } = useTranslation();
    const { isPremium, subscriptionType, expiresAt } = useSubscriptionStore();

    return (
        <SettingSection title={t('settings.sections.subscription', 'Subscription')}>
            <SettingItem
                icon={isPremium ? 'star' : 'star-outline'}
                label={t('settings.subscription.status', 'Status')}
                value={isPremium
                    ? t('settings.subscription.premium', 'Premium') + (subscriptionType ? ` (${subscriptionType})` : '')
                    : t('settings.subscription.free', 'Free')
                }
                hasChevron={false}
            />
            {isPremium && expiresAt && subscriptionType !== 'lifetime' && (
                <SettingItem
                    icon="calendar-outline"
                    label={t('settings.subscription.expiresAt', 'Expires')}
                    value={new Date(expiresAt).toLocaleDateString()}
                    hasChevron={false}
                />
            )}
            <SettingItem
                icon="refresh-outline"
                label={isRestoring
                    ? t('common.loading', 'Loading...')
                    : t('settings.subscription.restore', 'Restore Purchases')
                }
                onPress={() => {
                    haptics.selection();
                    onRestorePurchases();
                }}
            />
        </SettingSection>
    );
});

SubscriptionSection.displayName = 'SubscriptionSection';
