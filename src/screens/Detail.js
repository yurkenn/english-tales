// src/screens/Detail.js
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import FormatReadTime from '../components/FormatReadTime';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BookmarkButton from '../components/BookmarkButton';
import LikeButton from '../components/Detail/LikeButton';
import InfoComponent from '../components/Detail/InfoComponent';
import SettingsButton from '../components/Detail/SettingsButton';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { urlFor } from '../../sanity';
import Icon from '../components/Icons';
import { wp, hp, moderateScale, fontSizes, spacing, layout } from '../utils/dimensions';

// Redux imports
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../store/slices/bookmarkSlice';
import { toggleLike, fetchTaleLikes } from '../store/slices/likeSlice';
import { updateStreak } from '../store/slices/userStatsSlice';
import { selectUser, selectBookmarks, selectUserLikes, selectLikes } from '../store/selectors';
import FontSizeSettings from '../components/Modal/FontSizeSettings';
import { updateLastRead } from '../store/slices/readingProgressSlice';

const Detail = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { data } = route.params;

  // Redux selectors
  const userInfo = useSelector(selectUser);
  const bookmarks = useSelector(selectBookmarks);
  const userLikes = useSelector(selectUserLikes);
  const likes = useSelector(selectLikes);

  const bottomSheetRef = useRef(null);

  // Local states
  const [isLoading, setIsLoading] = useState(false);

  const readTime = FormatReadTime(data?.readTime);
  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark?.slug?.current === data?.slug?.current
  );
  const hasLiked = userLikes[data._id] || false;
  const currentLikes = likes[data._id] || 0;

  useEffect(() => {
    if (data._id) {
      dispatch(fetchTaleLikes(data._id));
    }
  }, [data._id]);

  const handleLike = async () => {
    if (!userInfo) {
      Toast.show({
        type: 'error',
        text1: 'Please login to like stories',
      });
      return;
    }

    try {
      await dispatch(
        toggleLike({
          taleId: data._id,
          currentLikes,
        })
      ).unwrap();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update like',
        text2: error.message,
      });
    }
  };

  const handleBookmark = async () => {
    if (!userInfo) {
      Toast.show({
        type: 'error',
        text1: 'Please login to bookmark stories',
      });
      return;
    }

    try {
      await dispatch(
        toggleBookmark({
          bookData: data,
          userId: userInfo.uid,
        })
      ).unwrap();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update bookmark',
        text2: error.message,
      });
    }
  };

  const handleReadButton = async () => {
    try {
      if (!userInfo?.uid) {
        Toast.show({
          type: 'error',
          text1: 'Please login to read stories',
        });
        return;
      }

      setIsLoading(true);

      // Update last read
      await dispatch(
        updateLastRead({
          userId: userInfo.uid,
          storyData: {
            ...data,
            imageURL: data.imageURL ? urlFor(data.imageURL).url() : null,
          },
        })
      ).unwrap();

      // Navigate to content
      navigation.navigate('Content', {
        slug: data.slug.current,
        category: data.category,
      });
    } catch (error) {
      console.error('Error starting reading:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start reading. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerStyle: {
        backgroundColor: 'transparent',
      },
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <LikeButton hasLiked={hasLiked} isLoading={isLoading} handleLike={handleLike} />
          <BookmarkButton isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
          <SettingsButton handleOpenModal={() => bottomSheetRef.current?.expand()} />
        </View>
      ),
    });
  }, [hasLiked, isLoading, isBookmarked]);

  return (
    <View style={styles.container}>
      {/* Top Gradient for Header */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      {/* Image Section with Gradient */}
      <View style={styles.imageContainer}>
        <Animated.Image
          entering={FadeInDown.springify()}
          source={{ uri: data?.imageURL }}
          style={styles.image}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', Colors.dark900]}
          style={styles.imageGradient}
          pointerEvents="none"
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {data?.title}
        </Text>

        <InfoComponent readTime={readTime} likes={currentLikes} />

        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={4}>
            {data?.description}
          </Text>
        </View>

        <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
          <LinearGradient
            colors={[Colors.primary, Colors.primary700]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Icon
              name="book-outline"
              size={moderateScale(24)}
              color={Colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Start Reading</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={['50%']}
        index={-1}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: Colors.dark900 }}
        handleIndicatorStyle={{ backgroundColor: Colors.white }}
      >
        <FontSizeSettings />
      </BottomSheet>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(12),
    zIndex: 10,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: spacing.sm,
    borderRadius: layout.borderRadius * 2.5,
  },
  imageContainer: {
    width: '100%',
    height: hp(45),
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentContainer: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: Colors.white,
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
  },
  descriptionContainer: {
    flex: 1,
  },
  description: {
    fontSize: fontSizes.md,
    color: Colors.gray500,
    lineHeight: hp(3),
  },
  readButton: {
    height: hp(7),
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginTop: 'auto',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default Detail;
