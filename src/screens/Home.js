// src/screens/Home.js
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Components
import FeaturedStories from '../components/Home/FeaturedStories';
import Categories from '../components/Category/Categories';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import ContinueReading from '../components/Home/ContinueReading';

// Hooks
import useGetFeaturedStories from '../hooks/useGetFeaturedStories';
import useGetCategories from '../hooks/useGetCategories';
import useGetAllTales from '../hooks/useGetAllTales';

// Utils and Constants
import { Colors } from '../constants/colors';
import { wp, hp, fontSizes, spacing, layout } from '../utils/dimensions';
import ExploreAllButton from '../components/ExploreAllButton';

const LoadingPlaceholder = () => (
  <View style={styles.loadingContainer}>
    <LinearGradient colors={['#1F1F1F', '#2A2A2A', '#1F1F1F']} style={styles.loadingGradient}>
      <LoadingAnimation />
    </LinearGradient>
  </View>
);

const Home = ({ navigation }) => {
  const { featuredStories, loading: storiesLoading, error: storiesError } = useGetFeaturedStories();
  const { categories } = useGetCategories();
  const getAllTales = useGetAllTales();
  const [lastRead, setLastRead] = React.useState(null);

  useFocusEffect(
    useCallback(() => {
      const getLastRead = async () => {
        try {
          const value = await AsyncStorage.getItem('lastRead');
          if (value !== null) {
            setLastRead(JSON.parse(value));
          }
        } catch (error) {
          Alert.alert('Error', 'There was an issue retrieving your last read story.');
        }
      };

      getLastRead();
    }, [])
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
        <ContinueReading lastRead={lastRead} />
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
    paddingHorizontal: wp(2),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark900,
  },
  loadingGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContainer: {
    marginBottom: hp(3),
  },
  categoriesContainer: {
    marginVertical: hp(2),
  },
  myStoriesContainer: {
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: fontSizes.xl,
    fontWeight: '600',
    marginBottom: hp(2),
    paddingHorizontal: wp(3),
  },
});

export default Home;
