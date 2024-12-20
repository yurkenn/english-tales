import { useEffect } from 'react';
import useQueryState from './useQueryState';
import { getAllTales } from '../utils/sanity-utils';

const useGetAllTales = () => {
  const { data: allTales, loading, error, execute } = useQueryState(getAllTales);

  useEffect(() => {
    execute();
  }, [execute]);

  return { allTales, loading, error };
};

export default useGetAllTales;
