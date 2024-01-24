import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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
import ProfileScreen from '../components/Modal/Profile/ProfileScreen';
import { AuthContext } from '../store/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

const Home = ({ navigation }) => {
  const { featuredStories, loading, error } = useGetFeaturedStories();
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => bottomSheetRef.current?.expand()}>
          <Image
            style={styles.profileImage}
            source={userInfo.photoURL ? { uri: userInfo.photoURL } : require(DEFAULT_IMAGE_PATH)}
            accessibilityLabel="User's profile image"
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, userInfo.photoURL]);

  useFocusEffect(
    useCallback(() => {
      const getLastRead = async () => {
        try {
          const value = await AsyncStorage.getItem('lastRead');
          if (value !== null) {
            setLastRead(JSON.parse(value));
          }
        } catch (error) {
          throw new Error(`Error retrieving last read tale: ${error.message}`);
          Alert.alert('Error', 'There was an issue retrieving your last read story.');
        }
      };

      getLastRead();
    }, [navigation])
  );

  const handleExploreAll = () => {
    navigation.navigate('AllTales', { data: getAllTales.allTales });
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorAnimation />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Animated.View entering={FadeInDown.delay(400)} style={styles.featureContainer}>
        <Text style={styles.featureText}>Featured Tales</Text>
        <FlashList
          data={featuredStories}
          estimatedItemSize={200}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <FeaturedStories data={item} navigation={navigation} />}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(600)} style={styles.categoriesContainer}>
        <Text style={styles.categoriesText}>Categories</Text>
        <FlatList
          data={categories}
          horizontal
          estimatedItemSize={200}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Categories data={item} />}
        />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(800)} style={styles.myStoriesContainer}>
        <Text style={styles.myStoriesText}>Last Read</Text>
        <ContinueReading lastRead={lastRead} />
      </Animated.View>
      <TouchableOpacity onPress={handleExploreAll} style={styles.button}>
        <Text style={styles.buttonText}>Explore All</Text>
      </TouchableOpacity>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.dark900 }}
        handleIndicatorStyle={{ backgroundColor: Colors.white }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetScrollView>
          <ProfileScreen />
        </BottomSheetScrollView>
      </BottomSheet>
    </ScrollView>
  );
};

export default Home;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: windowHeight * 0.02,
  },
  featureContainer: {},
  featureText: {
    color: Colors.white,
    fontSize: windowHeight * 0.027,
    fontWeight: '500',
    marginBottom: windowHeight * 0.02,
    paddingHorizontal: windowWidth * 0.03,
  },
  categoriesContainer: {
    flex: 1,
    marginTop: windowHeight * 0.02,
  },
  categoriesText: {
    color: Colors.white,
    fontSize: windowHeight * 0.027,
    fontWeight: '500',
    paddingHorizontal: windowWidth * 0.03,
  },
  myStoriesContainer: {
    paddingHorizontal: windowWidth * 0.03,
  },
  myStoriesText: {
    color: Colors.white,
    fontSize: windowHeight * 0.027,
    fontWeight: '500',
    marginBottom: windowHeight * 0.02,
  },
  button: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: windowHeight * 0.06,
    justifyContent: 'center',
    marginVertical: windowHeight * 0.02,
    marginHorizontal: windowWidth * 0.03,
  },
  buttonText: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    fontWeight: '500',
    textAlign: 'center',
  },
  profileImage: {
    borderRadius: 30,
    height: 30,
    marginRight: windowWidth * 0.03,
    width: 30,
  },
});
