import React from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a client with aggressive default options for static content
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 60 * 60 * 1000,    // 1 hour (Stories are mostly static)
            gcTime: 24 * 60 * 60 * 1000,   // 24 hours persistence
            refetchOnWindowFocus: false,
            refetchOnReconnect: 'always',
        },
        mutations: {
            retry: 1,
        },
    },
});

// Create Async Storage Persister
const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'ENGLISH_TALES_OFFLINE_CACHE',
});

interface QueryProviderProps {
    children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: asyncStoragePersister,
                maxAge: 1000 * 60 * 60 * 24, // 24 hours
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
};

export { queryClient };
