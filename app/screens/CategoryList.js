import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import useGetTalesByCategory from '../hooks/useGetTalesByCategory';
import CategoryCard from '../components/Category/CategoryCard';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import { Colors } from '../constants/colors';

const CategoryList = ({ route }) => {
  const { category } = route.params;

  const { categoryList, loading, error } = useGetTalesByCategory(category);

  console.log('CategoryList', categoryList);
  // author , imageURL , title , slug

  const renderItem = ({ item }) => <CategoryCard data={item} />;

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;

  return (
    <View style={styles.container}>
      <FlatList data={categoryList} renderItem={renderItem} keyExtractor={(item) => item.slug} />
    </View>
  );
};

export default CategoryList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
    padding: 10,
  },
});