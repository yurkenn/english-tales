import { useState, useCallback } from 'react';

interface UseAsyncActionOptions {
    onError?: (error: Error) => void;
}

interface UseAsyncActionReturn {
    loading: boolean;
    execute: <T>(action: () => Promise<T>) => Promise<T | undefined>;
}

/**
 * Custom hook to handle asynchronous actions with loading and error states.
 * 
 * @param options - Configuration options like onError callback
 * @returns An object containing the execute function and loading state
 */
export const useAsyncAction = (options: UseAsyncActionOptions = {}): UseAsyncActionReturn => {
    const [loading, setLoading] = useState(false);

    const execute = useCallback(async <T>(action: () => Promise<T>): Promise<T | undefined> => {
        setLoading(true);
        try {
            const result = await action();
            return result;
        } catch (error) {
            if (options.onError) {
                options.onError(error as Error);
            }
            return undefined;
        } finally {
            setLoading(false);
        }
    }, [options]);

    return { loading, execute };
};
