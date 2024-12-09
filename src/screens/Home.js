import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import FeaturedStories from '../components/Home/FeaturedStories';
import Categories from '../components/Category/Categories';
import ContinueReading from '../components/Home/ContinueReading';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import useGetFeaturedStories from '../hooks/useGetFeaturedStories';
import useGetCategories from '../hooks/useGetCategories';
import useGetAllTales from '../hooks/useGetAllTales';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FEATURED_ITEM_SIZE = SCREEN_WIDTH * 0.5;
const CATEGORY_ITEM_SIZE = SCREEN_WIDTH * 0.25;

const ExploreAllButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.exploreButtonContainer}>
    <LinearGradient
      colors={[Colors.primary, Colors.primary700]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.exploreButton}
    >
      <View style={styles.buttonContent}>
        <View style={styles.buttonLeftContent}>
          <Text style={styles.buttonTitle}>Explore All Stories</Text>
          <Text style={styles.buttonSubtitle}>Discover more stories</Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon name="arrow-forward" size={24} color={Colors.white} />
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const Home = ({ navigation }) => {
  const { featuredStories, loading: storiesLoading, error: storiesError } = useGetFeaturedStories();
  const { categories } = useGetCategories();
  const getAllTales = useGetAllTales();
  const [lastRead, setLastRead] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const getLastRead = async () => {
        try {
          const value = await AsyncStorage.getItem('lastRead');
          if (value !== null) {
            const parsedData = JSON.parse(value);
            console.log('Last read data:', parsedData); // Debug log
            if (!parsedData.imageURL) {
              console.warn('Missing imageURL in lastRead data');
            }
            setLastRead(parsedData);
          }
        } catch (error) {
          console.error('Error retrieving last read:', error);
          Alert.alert('Error', 'There was an issue retrieving your last read story.');
        }
      };

      getLastRead();
    }, [navigation])
  );

  if (storiesLoading) return <LoadingAnimation />;
  if (storiesError) return <ErrorAnimation />;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View entering={FadeInDown.delay(400)} style={styles.featureContainer}>
        <Text style={styles.sectionTitle}>Featured Stories</Text>
        <View style={styles.featuredListContainer}>
          <FlashList
            data={featuredStories}
            estimatedItemSize={FEATURED_ITEM_SIZE}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <FeaturedStories data={item} navigation={navigation} index={index} />
            )}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600)} style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesListContainer}>
          <FlashList
            data={categories}
            estimatedItemSize={CATEGORY_ITEM_SIZE}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => <Categories data={item} index={index} />}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800)} style={styles.myStoriesContainer}>
        <Text style={styles.sectionTitle}>Continue Reading</Text>
        <ContinueReading lastRead={lastRead} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1000)} style={styles.exploreContainer}>
        <ExploreAllButton
          onPress={() => navigation.navigate('AllTales', { data: getAllTales.allTales })}
        />
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  contentContainer: {
    paddingTop: SCREEN_HEIGHT * 0.02,
    paddingBottom: SCREEN_HEIGHT * 0.02,
  },
  featuredListContainer: {
    height: SCREEN_HEIGHT * 0.32,
  },
  categoriesListContainer: {
    height: SCREEN_HEIGHT * 0.15,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: SCREEN_HEIGHT * 0.024,
    fontWeight: '600',
    marginBottom: SCREEN_HEIGHT * 0.012,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
  },
  featureContainer: {
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  categoriesContainer: {
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  myStoriesContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  exploreContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.05,
  },
  exploreButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  exploreButton: {
    width: '100%',
    padding: SCREEN_WIDTH * 0.04,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonLeftContent: {
    flex: 1,
  },
  buttonTitle: {
    color: Colors.white,
    fontSize: SCREEN_HEIGHT * 0.022,
    fontWeight: '700',
    marginBottom: 4,
  },
  buttonSubtitle: {
    color: Colors.white + '90',
    fontSize: SCREEN_HEIGHT * 0.016,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 8,
  },
});

export default Home;
