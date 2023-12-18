import { useEffect, useMemo, useState } from 'react';
import { getCategories } from '../utils/sanity-utils';

const useGetCategories = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await getCategories();
        setCategories(categories);
      } catch (error) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const memoizedCategories = useMemo(() => categories, [categories]);

  return { loading, error, categories: memoizedCategories };
};

export default useGetCategories;
