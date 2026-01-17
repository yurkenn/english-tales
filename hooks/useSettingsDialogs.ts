import { useRef, useState, useCallback, useMemo } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';

export type DialogName =
    | 'signOut'
    | 'clearCache'
    | 'changePassword'
    | 'language'
    | 'theme'
    | 'deleteAccount';

interface DialogState {
    ref: React.RefObject<BottomSheet | null>;
    isOpen: boolean;
}

export type DialogsState = Record<DialogName, DialogState>;

/**
 * Custom hook for managing settings dialogs with unified API.
 * Reduces repetitive state/ref management across multiple dialogs.
 */
export function useSettingsDialogs() {
    // Single state object for all dialog open states
    const [openStates, setOpenStates] = useState<Record<DialogName, boolean>>({
        signOut: false,
        clearCache: false,
        changePassword: false,
        language: false,
        theme: false,
        deleteAccount: false,
    });

    // Create refs once
    const signOutRef = useRef<BottomSheet>(null);
    const clearCacheRef = useRef<BottomSheet>(null);
    const changePasswordRef = useRef<BottomSheet>(null);
    const languageRef = useRef<BottomSheet>(null);
    const themeRef = useRef<BottomSheet>(null);
    const deleteAccountRef = useRef<BottomSheet>(null);

    const refs: Record<DialogName, React.RefObject<BottomSheet | null>> = useMemo(
        () => ({
            signOut: signOutRef,
            clearCache: clearCacheRef,
            changePassword: changePasswordRef,
            language: languageRef,
            theme: themeRef,
            deleteAccount: deleteAccountRef,
        }),
        []
    );

    const openDialog = useCallback((name: DialogName) => {
        setOpenStates((prev) => ({ ...prev, [name]: true }));
        // expand() is handled by useEffect in SettingsDialogs component
    }, []);

    const closeDialog = useCallback((name: DialogName) => {
        refs[name].current?.close();
        setTimeout(() => setOpenStates((prev) => ({ ...prev, [name]: false })), 300);
    }, [refs]);

    // Construct dialogs object with both ref and isOpen for each dialog
    const dialogs: DialogsState = useMemo(
        () => ({
            signOut: { ref: refs.signOut, isOpen: openStates.signOut },
            clearCache: { ref: refs.clearCache, isOpen: openStates.clearCache },
            changePassword: { ref: refs.changePassword, isOpen: openStates.changePassword },
            language: { ref: refs.language, isOpen: openStates.language },
            theme: { ref: refs.theme, isOpen: openStates.theme },
            deleteAccount: { ref: refs.deleteAccount, isOpen: openStates.deleteAccount },
        }),
        [refs, openStates]
    );

    return {
        dialogs,
        openDialog,
        closeDialog,
    };
}
