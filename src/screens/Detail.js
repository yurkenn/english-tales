import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../constants/colors';
import FormatReadTime from '../components/FormatReadTime';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BookmarkButton from '../Detail/BookmarkButton';
import LikeButton from '../components/Detail/LikeButton';
import InfoComponent from '../components/Detail/InfoComponent';
import SettingsButton from '../components/Detail/SettingsButton';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { fetchLikes, unlikeTale, updateLikes } from '../utils/sanity-utils';
import { useBookmark } from '../store/BookmarkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontSizeSettings from '../components/Modal/FontSizeSettings';
import { useFontSize } from '../store/FontSizeContext';
import Icon from '../components/Icons';
import { urlFor } from '../../sanity';
import { wp, hp, moderateScale, fontSizes, spacing, layout } from '../utils/dimensions';

const Detail = ({ route, navigation }) => {
  const { data } = route.params;
  const { bookmarks, toggleBookmark } = useBookmark();
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { fontSize } = useFontSize();
  const bottomSheetRef = useRef(null);
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  const readTime = FormatReadTime(data?.readTime);
  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark?.slug?.current === data?.slug?.current
  );

  const handleLike = async () => {
    if (!hasLiked) {
      setHasLiked(true);
      setLikes(likes + 1);
      await updateLikes(data._id, likes + 1);
      await AsyncStorage.setItem(`liked_${data._id}`, 'true');
    }
  };

  const handleUnlike = async () => {
    setHasLiked(false);
    setLikes(likes - 1);
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
    try {
      const lastReadData = {
        ...data,
        // Make sure to convert the Sanity image URL to a string
        imageURL: data.imageURL ? urlFor(data.imageURL).url() : null,
        progress: 0,
        lastReadAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('lastRead', JSON.stringify(lastReadData));
      navigation.navigate('Content', { slug: data.slug.current });
    } catch (error) {
      console.error('Error saving last read:', error);
    }
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
      headerTransparent: true,
      headerStyle: {
        backgroundColor: 'transparent',
      },
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <LikeButton
            hasLiked={hasLiked}
            isLoading={isLoading}
            handleLike={handleLike}
            handleUnlike={handleUnlike}
          />
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

        <InfoComponent readTime={readTime} likes={likes} />

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
        snapPoints={['40%']}
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
