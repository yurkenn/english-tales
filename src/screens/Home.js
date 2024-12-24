// src/screens/Home.js
import { Alert, FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Components
import FeaturedStories from '../components/Home/FeaturedStories';
import Categories from '../components/Category/Categories';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import ContinueReading from '../components/Home/ContinueReading';
import ExploreAllButton from '../components/ExploreAllButton';

// Hooks and Redux
import useGetFeaturedStories from '../hooks/useGetFeaturedStories';
import useGetCategories from '../hooks/useGetCategories';
import useGetAllTales from '../hooks/useGetAllTales';
import { useDispatch, useSelector } from 'react-redux';
import { loadLastRead } from '../store/slices/readingProgressSlice';

// Utils and Constants
import { Colors } from '../constants/colors';
import { wp, hp, fontSizes, spacing, layout } from '../utils/dimensions';

const LoadingPlaceholder = () => (
  <View style={styles.loadingContainer}>
    <LinearGradient colors={['#1F1F1F', '#2A2A2A', '#1F1F1F']} style={styles.loadingGradient}>
      <LoadingAnimation />
    </LinearGradient>
  </View>
);

const Home = ({ navigation }) => {
  const dispatch = useDispatch();
  const { featuredStories, loading: storiesLoading, error: storiesError } = useGetFeaturedStories();
  const { categories } = useGetCategories();
  const getAllTales = useGetAllTales();

  // Get user and last read from Redux
  const userInfo = useSelector((state) => state.auth.user);
  const lastRead = useSelector((state) => state.readingProgress.lastRead);
  const isLoadingLastRead = useSelector((state) => state.readingProgress.loading);

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        if (userInfo?.uid) {
          try {
            await dispatch(loadLastRead(userInfo.uid)).unwrap();
          } catch (error) {
            console.error('Error loading last read:', error);
            Alert.alert('Error', 'There was an issue retrieving your reading progress.');
          }
        }
      };

      loadUserData();
    }, [userInfo?.uid, dispatch])
  );

  if (storiesLoading) return <LoadingPlaceholder />;
  if (storiesError) return <ErrorAnimation />;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View entering={FadeInDown.delay(400)} style={styles.featureContainer}>
        <Text style={styles.sectionTitle}>Featured Tales</Text>
        <FlashList
          data={featuredStories}
          estimatedItemSize={200}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <FeaturedStories data={item} navigation={navigation} index={index} />
          )}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600)} style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          estimatedItemSize={100}
          renderItem={({ item, index }) => <Categories data={item} index={index} />}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800)} style={styles.myStoriesContainer}>
        <Text style={styles.sectionTitle}>Continue Reading</Text>
        <ContinueReading
          lastRead={lastRead}
          isLoading={isLoadingLastRead}
          navigation={navigation}
        />
      </Animated.View>

      <ExploreAllButton
        onPress={() => navigation.navigate('AllTales', { data: getAllTales.allTales })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  contentContainer: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  featureContainer: {
    marginBottom: hp(3),
  },
  categoriesContainer: {
    marginVertical: hp(3),
  },
  myStoriesContainer: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: fontSizes.xl,
    fontWeight: '600',
    marginBottom: hp(2),
  },
});

export default Home;
