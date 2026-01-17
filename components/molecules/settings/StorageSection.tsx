import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDownloadStore, formatBytes } from '@/store/downloadStore';
import { SettingItem } from '@/components/molecules/SettingItem';
import { SettingSection } from '@/components/molecules/SettingSection';
import { haptics } from '@/utils/haptics';

interface StorageSectionProps {
    onClearCachePress: () => void;
}

export const StorageSection: FC<StorageSectionProps> = memo(({ onClearCachePress }) => {
    const { t } = useTranslation();
    const { downloads, actions: downloadActions } = useDownloadStore();

    const downloadSize = downloadActions.getTotalDownloadSize();
    const downloadCount = Object.keys(downloads).length;

    return (
        <SettingSection title={t('settings.sections.storage')}>
            <SettingItem
                icon="cloud-download-outline"
                label={t('settings.storage.downloads')}
                value={downloadCount > 0
                    ? t('settings.storage.storiesCount', { count: downloadCount }) + ` (${formatBytes(downloadSize)})`
                    : t('settings.storage.none')
                }
                hasChevron={false}
            />
            <SettingItem
                icon="trash-outline"
                label={t('settings.storage.clearCache')}
                onPress={() => {
                    haptics.selection();
                    onClearCachePress();
                }}
            />
        </SettingSection>
    );
});

StorageSection.displayName = 'StorageSection';
