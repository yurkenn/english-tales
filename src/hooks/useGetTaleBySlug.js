import { useEffect, useMemo } from 'react';
import useQueryState from './useQueryState';
import { getTaleBySlug } from '../utils/sanity-utils';

const useGetTaleBySlug = (slug) => {
  const { data: tale, loading, error, execute } = useQueryState(getTaleBySlug);

  useEffect(() => {
    const fetchTale = async () => {
      if (!slug) {
        return;
      }
      await execute(slug);
    };

    fetchTale();
  }, [slug, execute]);

  // Memoize the tale data to prevent unnecessary re-renders
  const memoizedTale = useMemo(() => tale || [], [tale]);

  // Add cleanup logic when component unmounts
  useEffect(() => {
    return () => {
      // Any cleanup needed
    };
  }, []);

  return {
    tale: memoizedTale,
    loading,
    error,
    // Expose refetch functionality
    refetch: () => execute(slug),
  };
};

export default useGetTaleBySlug;
