import { useEffect, useMemo } from 'react';
import useQueryState from './useQueryState';
import { getCategories } from '../utils/sanity-utils';

const useGetCategories = () => {
  const { data: categories, loading, error, execute } = useQueryState(getCategories);

  useEffect(() => {
    execute();
  }, [execute]);

  const memoizedCategories = useMemo(() => categories, [categories]);

  return { categories: memoizedCategories, loading, error };
};

export default useGetCategories;
