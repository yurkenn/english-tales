import { useState, useCallback } from 'react';

const useQueryState = (queryFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // Changed initial loading state to false
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const result = await queryFn(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [queryFn]
  );

  return { data, loading, error, execute, setData };
};

export default useQueryState;
