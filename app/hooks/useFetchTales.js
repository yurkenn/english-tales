import { useState, useEffect, useMemo } from 'react';
import { firestore } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const useFetchTales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fetchedTales, setFetchedTales] = useState([]);
  const [fetchedCategories, setFetchedCategories] = useState([]);

  useEffect(() => {
    const fetchTalesAndCategories = async () => {
      const talesCollectionRef = collection(firestore, 'tales');

      try {
        const querySnapshot = await getDocs(talesCollectionRef);

        const talesArray = [];
        const categoriesArray = [];
        querySnapshot.forEach((doc) => {
          const tale = {
            id: doc.id,
            ...doc.data(),
          };
          talesArray.push(tale);
          if (!categoriesArray.includes(tale.category)) {
            categoriesArray.push(tale.category);
          }
        });

        setFetchedTales(talesArray);
        setFetchedCategories(categoriesArray);
        setLoading(false);
      } catch (error) {
        console.log('Error fetching tales and categories: ', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchTalesAndCategories();
  }, []);

  const tales = useMemo(() => fetchedTales, [fetchedTales]);
  const categories = useMemo(() => fetchedCategories, [fetchedCategories]);

  return { tales, categories, loading, error };
};

export default useFetchTales;
