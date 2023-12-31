import { useEffect, useState } from 'react';
import { getTaleBySlug } from '../utils/sanity-utils';

const useGetTaleBySlug = (slug) => {
  const [tale, setTale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTale = async () => {
      try {
        const tale = await getTaleBySlug(slug);
        setTale(tale);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
    fetchTale();
  }, [slug]);

  return { tale, loading, error };
};

export default useGetTaleBySlug;
