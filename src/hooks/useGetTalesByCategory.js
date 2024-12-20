import { useEffect, useCallback } from 'react';
import useQueryState from './useQueryState';
import { getTalesByCategory } from '../utils/sanity-utils';

const useGetTalesByCategory = (category) => {
  const { data: categoryList, loading, error, execute } = useQueryState(getTalesByCategory);

  const fetchTalesByCategory = useCallback(async () => {
    if (!category) return;
    await execute(category);
  }, [category, execute]);

  useEffect(() => {
    fetchTalesByCategory();
  }, [fetchTalesByCategory]);

  return { categoryList, loading, error };
};

export default useGetTalesByCategory;
