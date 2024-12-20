import { useEffect, useMemo } from 'react';
import useQueryState from './useQueryState';
import { getFeatured } from '../utils/sanity-utils';

const useGetFeaturedStories = () => {
  const { data: featuredStories, loading, error, execute } = useQueryState(getFeatured);

  useEffect(() => {
    execute();
  }, [execute]);

  const memoizedStories = useMemo(() => featuredStories, [featuredStories]);

  return { featuredStories: memoizedStories, loading, error };
};

export default useGetFeaturedStories;
