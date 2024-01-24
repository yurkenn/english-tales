import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
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
import Animated, { FadeInDown } from 'react-native-reanimated';

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
      <Animated.View entering={FadeInDown.delay(200)} style={styles.titleContainer}>
        <Text style={styles.title}>{data?.title}</Text>
      </Animated.View>

      {/* Image and Info */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.imageInfoContainer}>
        <Animated.Image style={styles.image} source={{ uri: data?.imageURL }} />
        <InfoComponent readTime={readTime} likes={likes} />
      </Animated.View>

      {/* Description */}
      <Animated.View entering={FadeInDown.delay(600)} style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.description}>{data?.description}</Text>
      </Animated.View>

      {/* Continue Reading Button */}
      <Animated.View entering={FadeInDown.delay(800)} style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
          <Text style={styles.readText}>Continue Reading</Text>
        </TouchableOpacity>
      </Animated.View>
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

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: windowHeight * 0.12,
    backgroundColor: Colors.modalBackground,
  },
  titleContainer: {
    marginBottom: windowHeight * 0.01,
  },
  title: {
    fontSize: windowHeight * 0.03,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  imageInfoContainer: {
    alignItems: 'center',
    marginVertical: windowHeight * 0.015,
  },
  image: {
    width: windowWidth * 0.6,
    height: windowHeight * 0.4,
    resizeMode: 'cover',
    borderRadius: 6,
    marginBottom: windowHeight * 0.01,
  },
  descriptionContainer: {
    marginHorizontal: windowWidth * 0.065,
    marginTop: windowHeight * 0.01,
    paddingBottom: windowHeight * 0.01,
  },
  descriptionTitle: {
    fontSize: windowHeight * 0.025,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: windowHeight * 0.01,
  },
  description: {
    fontSize: windowHeight * 0.02,
    color: Colors.white,
  },
  buttonContainer: {
    justifyContent: 'flex-end',
    paddingHorizontal: windowWidth * 0.03,
  },
  readButton: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: windowHeight * 0.06,
    justifyContent: 'center',
    marginVertical: windowHeight * 0.02,
    marginHorizontal: windowWidth * 0.03,
    shadowColor: Colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  readText: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
