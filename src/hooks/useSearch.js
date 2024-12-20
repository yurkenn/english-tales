import { useEffect, useCallback, useState, useRef } from 'react';
import useQueryState from './useQueryState';
import { getTalesBySearch } from '../utils/sanity-utils';
import { debounce } from 'lodash';

const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: results, loading, error, execute } = useQueryState(getTalesBySearch);
  const debouncedSearch = useRef(null);

  // Initialize debounced search function
  useEffect(() => {
    debouncedSearch.current = debounce(async (term) => {
      if (!term.trim()) {
        return;
      }
      await execute(term);
    }, 300);

    return () => {
      if (debouncedSearch.current) {
        debouncedSearch.current.cancel();
      }
    };
  }, [execute]);

  // Handle search term changes
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    if (term.trim()) {
      // Only search if there's a non-empty term
      if (debouncedSearch.current) {
        debouncedSearch.current(term);
      }
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    if (debouncedSearch.current) {
      debouncedSearch.current.cancel();
    }
  }, []);

  return {
    searchTerm,
    setSearchTerm: handleSearch,
    clearSearch,
    results: results || [],
    loading,
    error,
  };
};

export default useSearch;
