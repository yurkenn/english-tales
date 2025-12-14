// API Result pattern for typed error handling
export type Result<T> =
    | { success: true; data: T }
    | { success: false; error: string };

// Generic API response wrapper
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    isLoading: boolean;
}

// Pagination types
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}
