import { Dimensions, StyleSheet, View, Text, FlatList } from 'react-native';
import React, { useState } from 'react';
import useGetTalesByCategory from '../hooks/useGetTalesByCategory';
import CategoryCard from '../components/Category/CategoryCard';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const CategoryList = ({ route }) => {
  const { category } = route.params;
  const { categoryList, loading, error } = useGetTalesByCategory(category);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <CategoryCard data={item} />
    </Animated.View>
  );

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;
  if (!categoryList?.length)
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tales found in this category</Text>
      </View>
    );

  return (
    <LinearGradient colors={['#1F1F1F', Colors.dark900]} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.resultCount}>{categoryList.length} Stories</Text>
      </View>

      <FlatList
        data={categoryList}
        estimatedItemSize={200}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </LinearGradient>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: windowWidth * 0.04,
  },
  headerContainer: {
    marginBottom: windowHeight * 0.02,
    paddingHorizontal: windowWidth * 0.02,
  },
  resultCount: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    fontWeight: '600',
    opacity: 0.8,
  },
  listContainer: {
    paddingBottom: windowHeight * 0.02,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark900,
  },
  emptyText: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    opacity: 0.7,
  },
});

export default CategoryList;
