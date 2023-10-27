import { useEffect, useState } from 'react';
import { getTalesBySearch } from '../utils/sanity-utils';

const useSearch = (search) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTale = async () => {
      try {
        const tale = await getTalesBySearch(search);
        setResults(tale);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
    fetchTale();
  }, [search]);

  return { results, loading, error };
};

export default useSearch;
