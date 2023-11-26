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
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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

const Home = ({ navigation }) => {
  const { featuredStories, loading, error } = useGetFeaturedStories();
  const { categories } = useGetCategories();
  const getAllTales = useGetAllTales();
  const { userInfo } = useContext(AuthContext);
  const [lastRead, setLastRead] = useState(null);
  const DEFAULT_IMAGE_PATH = '../../assets/images/blank-profile.png';

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ['35%', '55%', '75%'], []);

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
          console.log('Error retrieving last read tale:', error);
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
      <View style={styles.featureContainer}>
        <Text style={styles.featureText}>Featured Stories</Text>
        <FlashList
          data={featuredStories}
          estimatedItemSize={200}
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
        <Text style={styles.myStoriesText}>Last Read</Text>
        <ContinueReading lastRead={lastRead} />
      </View>
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

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginHorizontal: width * 0.025, // 2.5% of screen width
    marginVertical: height * 0.02, // 2% of screen height
  },
  featureContainer: {},
  featureText: {
    color: Colors.white,
    fontSize: width < 400 ? 18 : 20, // smaller font size for smaller screens
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
    fontSize: width < 400 ? 18 : 20,
    fontWeight: '500',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  myStoriesContainer: {
    paddingHorizontal: 10,
  },
  myStoriesText: {
    color: Colors.white,
    fontSize: width < 400 ? 18 : 20,
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
    fontSize: width < 400 ? 14 : 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  profileImage: {
    width: width * 0.09,
    height: height * 0.04,
    borderRadius: width * 0.09,
    marginRight: 10,
  },
});
