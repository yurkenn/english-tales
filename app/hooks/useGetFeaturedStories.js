import { useState, useEffect, useMemo } from 'react';
import { getFeatured } from '../utils/sanity-utils';

const useGetFeaturedStories = () => {
  const [featuredStories, setFeaturedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFeatured();
        setFeaturedStories(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Memoize the featuredStories array to optimize performance
  const memoizedFeaturedStories = useMemo(() => featuredStories, [featuredStories]);

  return { featuredStories: memoizedFeaturedStories, loading, error };
};

export default useGetFeaturedStories;
