import { useState, useEffect } from 'react';
import { firestore } from '../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const useFetchTales = () => {
  const [tales, setTales] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTalesAndCategories = async () => {
      const talesCollectionRef = collection(firestore, 'tales');

      try {
        const querySnapshot = await getDocs(talesCollectionRef);

        const fetchedTales = [];
        const fetchedCategories = [];
        querySnapshot.forEach((doc) => {
          const tale = {
            id: doc.id,
            ...doc.data(),
          };
          fetchedTales.push(tale);
          if (!fetchedCategories.includes(tale.category)) {
            fetchedCategories.push(tale.category);
          }
        });

        setTales(fetchedTales);
        setCategories(fetchedCategories);
        setLoading(false);
      } catch (error) {
        console.log('Error fetching tales and categories: ', error);
        setError(error);
        setLoading(false);
      }
    };

    fetchTalesAndCategories();
  }, []);

  return { tales, categories, loading, error };
};

export default useFetchTales;
