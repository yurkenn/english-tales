import { Dimensions, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import useGetTalesByCategory from '../hooks/useGetTalesByCategory';
import CategoryCard from '../components/Category/CategoryCard';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import { Colors } from '../constants/colors';

const CategoryList = ({ route }) => {
  const { category } = route.params;

  const { categoryList, loading, error } = useGetTalesByCategory(category);

  const renderItem = ({ item }) => <CategoryCard data={item} />;

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;

  return (
    <View style={styles.container}>
      <FlashList
        data={categoryList}
        estimatedItemSize={200}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
      />
    </View>
  );
};

export default CategoryList;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
    padding: width * 0.025, // Padding as 2.5% of screen width
  },
});
