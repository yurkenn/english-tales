import { useEffect, useState } from 'react';
import { getTalesByCategory } from '../utils/sanity-utils';

const useGetTalesByCategory = (category) => {
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTalesByCategory = async () => {
    try {
      const data = await getTalesByCategory(category);
      setCategoryList(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTalesByCategory();
  }, [category]);

  return { categoryList, loading, error };
};

export default useGetTalesByCategory;
