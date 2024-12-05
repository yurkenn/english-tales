import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import FormatReadTime from '../components/FormatReadTime';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import BookmarkButton from '../Detail/BookmarkButton';
import LikeButton from '../components/Detail/LikeButton';
import InfoComponent from '../components/Detail/InfoComponent';
import SettingsButton from '../components/Detail/SettingsButton';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { fetchLikes, unlikeTale, updateLikes } from '../utils/sanity-utils';
import { useBookmark } from '../store/BookmarkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontSizeSettings from '../components/Modal/FontSizeSettings';
import { useFontSize } from '../store/FontSizeContext';

const Detail = ({ route, navigation }) => {
  const { data } = route.params;
  const { bookmarks, toggleBookmark } = useBookmark();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const readTime = FormatReadTime(data?.readTime);
  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark?.slug?.current === data?.slug?.current
  );
  const { fontSize, changeFontSize } = useFontSize();
  const bottomSheetRef = useRef(null);
  const snapPoints = ['40%'];

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );

  const handleOpenModal = () => {
    bottomSheetRef.current?.expand();
  };

  const handleLike = async () => {
    if (!hasLiked) {
      setIsLiked(true);
      setLikes(likes + 1);
      setHasLiked(true);
      await updateLikes(data._id, likes + 1);
      await AsyncStorage.setItem(`liked_${data._id}`, 'true');
    }
  };

  const handleUnlike = async () => {
    setIsLiked(false);
    setLikes(likes - 1);
    setHasLiked(false);
    await unlikeTale(data._id, likes - 1);
  };

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
    await AsyncStorage.setItem('lastRead', JSON.stringify(data));
  };

  useEffect(() => {
    const fetchLikesForTale = async () => {
      const taleId = data._id;
      const likesCount = await fetchLikes(taleId);
      setLikes(likesCount);
      const likeStatus = await AsyncStorage.getItem(`liked_${taleId}`);
      if (likeStatus === 'true') setHasLiked(true);
      setIsLoading(false);
    };
    fetchLikesForTale();
  }, [data]);

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
  }, [hasLiked, isLoading, isBookmarked]);

  return (
    <>
      <Animated.ScrollView style={styles.container}>
        <LinearGradient colors={['#1F1F1F', Colors.dark900]} style={styles.gradientContainer}>
          <Animated.Image
            entering={FadeInDown.springify()}
            source={{ uri: data?.imageURL }}
            style={styles.image}
          />

          <Animated.View entering={SlideInRight.delay(300)} style={styles.contentContainer}>
            <Text style={styles.title}>{data?.title}</Text>
            <InfoComponent readTime={readTime} likes={likes} />

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{data?.description}</Text>
            </View>

            <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
              <LinearGradient colors={['#2A2A2A', '#1F1F1F']} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Continue Reading</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </Animated.ScrollView>

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

      <Toast />
    </>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: windowWidth * 0.02,
    marginRight: windowWidth * 0.02,
  },
  gradientContainer: {
    flex: 1,
    padding: windowWidth * 0.05,
    paddingTop: windowHeight * 0.12,
  },
  image: {
    width: windowWidth * 0.9,
    height: windowHeight * 0.45,
    borderRadius: 16,
    alignSelf: 'center',
  },
  contentContainer: {
    gap: windowHeight * 0.02,
    marginTop: windowHeight * 0.03,
  },
  title: {
    fontSize: windowHeight * 0.035,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  descriptionContainer: {
    gap: windowHeight * 0.01,
  },
  descriptionTitle: {
    fontSize: windowHeight * 0.025,
    fontWeight: '600',
    color: Colors.white,
  },
  description: {
    fontSize: windowHeight * 0.018,
    color: Colors.gray500,
    lineHeight: windowHeight * 0.028,
  },
  readButton: {
    marginTop: windowHeight * 0.02,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    padding: windowHeight * 0.02,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default Detail;
