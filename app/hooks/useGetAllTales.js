import { useState, useEffect } from 'react';
import { getAllTales } from '../utils/sanity-utils';

const useGetAllTales = () => {
  const [allTales, setAllTales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTales = async () => {
      try {
        const response = await getAllTales();
        setAllTales(response);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchTales();
  }, []);

  return { allTales, loading, error };
};

export default useGetAllTales;
