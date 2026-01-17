import { FC, memo } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '@gorhom/bottom-sheet';

import { ReadingGoalsSheet } from '@/components/organisms/ReadingGoalsSheet';
import { ActionSheet } from '@/components/molecules/ActionSheet';
import { haptics } from '@/utils/haptics';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
] as const;

interface ProfileSheetsProps {
    // Goals sheet
    isGoalsOpen: boolean;
    goalsRef: React.RefObject<BottomSheet | null>;
    currentGoal: number;
    onSelectGoal: (minutes: number) => void;
    onCloseGoals: () => void;

    // Language sheet
    isLangOpen: boolean;
    langRef: React.RefObject<BottomSheet | null>;
    currentLanguage: string;
    onSelectLanguage: (code: string) => void;
    onCloseLang: () => void;
}

export const ProfileSheets: FC<ProfileSheetsProps> = memo(({
    isGoalsOpen,
    goalsRef,
    currentGoal,
    onSelectGoal,
    onCloseGoals,
    isLangOpen,
    langRef,
    currentLanguage,
    onSelectLanguage,
    onCloseLang,
}) => {
    const { t } = useTranslation();

    return (
        <>
            {isGoalsOpen && (
                <ReadingGoalsSheet
                    ref={goalsRef}
                    currentGoal={currentGoal}
                    onSelectGoal={onSelectGoal}
                    onClose={onCloseGoals}
                />
            )}

            {isLangOpen && (
                <ActionSheet
                    ref={langRef}
                    title={t('settings.preferences.language')}
                    options={LANGUAGES.map((lang) => ({
                        label: lang.label,
                        icon: currentLanguage === lang.code ? 'checkmark-circle' : 'ellipse-outline',
                        onPress: () => {
                            haptics.success();
                            onSelectLanguage(lang.code);
                        },
                    }))}
                    onClose={onCloseLang}
                />
            )}
        </>
    );
});

ProfileSheets.displayName = 'ProfileSheets';
