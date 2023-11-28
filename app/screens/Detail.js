import React, {
  useState,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useRef,
  useCallback,
} from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLikes, unlikeTale, updateLikes } from '../utils/sanity-utils';
import { useBookmark } from '../store/BookmarkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookmarkButton from '../Detail/BookmarkButton';
import { Colors } from '../constants/colors';
import FormatReadTime from '../components/FormatReadTime';
import Toast from 'react-native-toast-message';
import LikeButton from '../components/Detail/LikeButton';
import InfoComponent from '../components/Detail/InfoComponent';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FontSizeSettings from '../components/Modal/FontSizeSettings';
import SettingsButton from '../components/Detail/SettingsButton';
import { useFontSize } from '../store/FontSizeContext';

const Detail = ({ route }) => {
  const { data } = route.params;

  const { bookmarks, toggleBookmark } = useBookmark();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();
  const snapPoints = ['30%'];
  const bottomSheetRef = useRef(null);
  const { fontSize, changeFontSize } = useFontSize();

  const readTime = FormatReadTime(data?.readTime);

  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark?.slug?.current === data?.slug?.current
  );

  const handleBookmark = () => {
    toggleBookmark(data);
    Toast.show({
      type: isBookmarked ? 'error' : 'success',
      position: 'top',
      text1: isBookmarked ? 'Bookmark removed!' : 'Bookmark added!',
      topOffset: 90,
    });
  };

  const handleReadButton = async () => {
    navigation.navigate('Content', { slug: data.slug.current });

    try {
      await AsyncStorage.setItem('lastRead', JSON.stringify(data));
    } catch (error) {
      throw new Error(`Error saving last read tale: ${error.message}`);
    }
  };

  const handleLike = async () => {
    if (!hasLiked) {
      setIsLiked(true);
      setLikes(likes + 1);
      setHasLiked(true);

      await updateLikes(data._id, likes + 1);

      try {
        await AsyncStorage.setItem(`liked_${data._id}`, 'true');
      } catch (error) {
        Toast.show({
          type: 'error',
          position: 'bottom',
          text1: 'There was an error saving your like.',
        });
        console.error(`Error saving like status for tale ${data._id}: ${error.message}`);
      }
    }
  };

  const handleUnlike = async () => {
    setIsLiked(false);
    setLikes(likes - 1);
    setHasLiked(false);

    await unlikeTale(data._id, likes - 1);
    Toast.show({
      type: 'info',
      position: 'bottom',
      text1: 'You unliked the tale.',
    });
  };

  useEffect(() => {
    const fetchLikesForTale = async () => {
      const taleId = data._id;
      const likes = await fetchLikes(taleId);
      setLikes(likes);

      try {
        const likeStatus = await AsyncStorage.getItem(`liked_${taleId}`);
        if (likeStatus === 'true') {
          setHasLiked(true);
        }
      } catch (error) {
        console.error(`Error fetching like status for tale ${taleId}: ${error.message}`);
      }

      setIsLoading(false);
    };
    fetchLikesForTale();
  }, [data]);

  const handleOpenModal = () => {
    bottomSheetRef.current?.expand();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <LikeButton
            hasLiked={hasLiked}
            isLoading={isLoading}
            handleLike={handleLike}
            handleUnlike={handleUnlike}
          />
          <BookmarkButton isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
          <SettingsButton handleOpenModal={handleOpenModal} />
        </View>
      ),
    });
  }, [hasLiked, isLoading, handleLike, handleUnlike, isBookmarked, handleBookmark]);

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{data?.title}</Text>
        <Text style={styles.author}>{data?.author}</Text>
      </View>

      {/* Image and Info */}
      <View style={styles.imageInfoContainer}>
        <Image style={styles.image} source={{ uri: data?.imageURL }} />
        <InfoComponent readTime={readTime} likes={likes} />
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.description}>{data?.description}</Text>
      </View>

      {/* Continue Reading Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
          <Text style={styles.readText}>Continue Reading</Text>
        </TouchableOpacity>
      </View>
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
          <FontSizeSettings fontSize={fontSize} changeFontSize={changeFontSize} />
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Toast Component */}
      <Toast />
    </View>
  );
};

export default Detail;

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: height * 0.1, // 10% of screen height
    backgroundColor: Colors.modalBackground,
  },
  titleContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: width < 400 ? 24 : 28, // smaller font size on smaller devices
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  author: {
    fontSize: width < 400 ? 16 : 18,
    fontWeight: 'normal',
    color: Colors.gray,
    textAlign: 'center',
  },
  imageInfoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: width * 0.5, // 50% of screen width
    height: height * 0.3, // 30% of screen height
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 10,
  },
  descriptionContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingBottom: 20,
  },
  descriptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
  },
  readButton: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 20,
    shadowColor: Colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  readText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
