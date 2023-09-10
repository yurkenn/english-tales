import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import FeaturedStories from '../components/Home/FeaturedStories';
import Categories from '../components/Category/Categories';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import MyStories from '../components/Home/MyStories';
import useGetFeaturedStories from '../hooks/useGetFeaturedStories';
import useGetCategories from '../hooks/useGetCategories';
import { Colors } from '../constants/colors';

const Home = () => {
  const { featuredStories, loading, error } = useGetFeaturedStories();
  const { categories } = useGetCategories();

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorAnimation />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.featureContainer}>
        <Text style={styles.featureText}>Featured Stories</Text>
        <FlatList
          data={featuredStories}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <FeaturedStories data={item} />}
        />
      </View>
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesText}>Categories</Text>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Categories data={item} />}
        />
      </View>
      <View style={styles.myStoriesContainer}>
        <Text style={styles.myStoriesText}>My Stories</Text>
        <MyStories data={categories} />
      </View>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Explore All</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 20,
  },
  featureContainer: {},
  featureText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  categoriesContainer: {
    marginTop: 20,
  },
  categoriesText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  myStoriesContainer: {
    paddingHorizontal: 10,
  },
  myStoriesText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
  },
  button: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
});
