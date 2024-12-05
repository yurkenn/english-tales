import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import FeaturedStories from '../components/Home/FeaturedStories';
import Categories from '../components/Category/Categories';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import useGetFeaturedStories from '../hooks/useGetFeaturedStories';
import useGetCategories from '../hooks/useGetCategories';
import { Colors } from '../constants/colors';
import useGetAllTales from '../hooks/useGetAllTales';
import ContinueReading from '../components/Home/ContinueReading';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { AuthContext } from '../store/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { userInfo } = useContext(AuthContext);
  const [lastRead, setLastRead] = useState(null);
  const DEFAULT_IMAGE_PATH = '../../assets/images/blank-profile.png';

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['100%'], []);
  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

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
    }, [navigation])
  );

  if (storiesLoading) return <LoadingPlaceholder />;
  if (storiesError) return <ErrorAnimation />;

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
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
          renderItem={({ item, index }) => <Categories data={item} index={index} />}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800)} style={styles.myStoriesContainer}>
        <Text style={styles.sectionTitle}>Last Read</Text>
        <ContinueReading lastRead={lastRead} />
      </Animated.View>

      <TouchableOpacity
        onPress={() => navigation.navigate('AllTales', { data: getAllTales.allTales })}
        style={styles.exploreButton}
      >
        <LinearGradient
          colors={['#1F1F1F', '#121212']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Explore All</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
    marginVertical: windowHeight * 0.02,
    marginHorizontal: windowWidth * 0.02,
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
  sectionTitle: {
    color: Colors.white,
    fontSize: windowHeight * 0.027,
    fontWeight: '600',
    marginBottom: windowHeight * 0.02,
    paddingHorizontal: windowWidth * 0.03,
  },
  featureContainer: {
    marginBottom: windowHeight * 0.03,
  },
  categoriesContainer: {
    marginVertical: windowHeight * 0.02,
  },
  myStoriesContainer: {
    paddingHorizontal: windowWidth * 0.03,
    marginBottom: windowHeight * 0.02,
  },
  exploreButton: {
    marginHorizontal: windowWidth * 0.03,
    marginVertical: windowHeight * 0.02,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    height: windowHeight * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    fontWeight: '600',
  },
  profileButton: {
    marginRight: windowWidth * 0.03,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileGradient: {
    padding: 2,
    borderRadius: 30,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.dark900,
  },
  bottomSheetIndicator: {
    backgroundColor: Colors.white,
  },
});

export default Home;
