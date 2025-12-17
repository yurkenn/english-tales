import { useState, useCallback } from 'react';

interface UseRefreshControlOptions {
    onRefresh: () => Promise<void> | void;
}

interface UseRefreshControlReturn {
    refreshing: boolean;
    onRefresh: () => Promise<void>;
}

/**
 * Hook for handling pull-to-refresh functionality
 */
export const useRefreshControl = ({ onRefresh }: UseRefreshControlOptions): UseRefreshControlReturn => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
        }
    }, [onRefresh]);

    return {
        refreshing,
        onRefresh: handleRefresh,
    };
};
