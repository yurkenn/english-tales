// src/screens/Detail.js
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BookmarkButton from '../components/Detail/BookmarkButton';
import LikeButton from '../components/Detail/LikeButton';
import SettingsButton from '../components/Detail/SettingsButton';
import Icon from '../components/Icons';
import { wp, hp, scale, fontSizes, spacing, layout, isSmallDevice } from '../utils/dimensions';
import FontSettingsModal from '../components/Modal/FontSettingsModal';

// Redux imports
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../store/slices/bookmarkSlice';
import { toggleLike, fetchTaleLikes } from '../store/slices/likeSlice';
import { updateStreak } from '../store/slices/userStatsSlice';
import { selectUser, selectBookmarks, selectUserLikes, selectLikes } from '../store/selectors';

const Detail = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { data } = route.params;

  // Redux selectors
  const userInfo = useSelector(selectUser);
  const bookmarks = useSelector(selectBookmarks);
  const userLikes = useSelector(selectUserLikes);
  const likes = useSelector(selectLikes);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isFontModalVisible, setFontModalVisible] = useState(false);

  // Format values
  const formattedDuration = `${data?.estimatedDuration} min`;
  const difficultyText = `${data?.difficulty.charAt(0).toUpperCase()}${data?.difficulty.slice(1)}`;

  useEffect(() => {
    if (data._id) {
      dispatch(fetchTaleLikes(data._id));
    }
  }, [data._id]);

  const hasLiked = userLikes[data._id] || false;
  const currentLikes = likes[data._id] || 0;
  const isBookmarked = bookmarks.some((bookmark) => bookmark.slug.current === data.slug.current);

  const handleLike = async () => {
    if (!userInfo) {
      Toast.show({
        type: 'error',
        text1: 'Please sign in to like stories',
        position: 'top',
        topOffset: 50,
      });
      return;
    }

    try {
      setIsLoading(true);
      await dispatch(
        toggleLike({
          taleId: data._id,
          currentLikes: currentLikes,
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        text1: hasLiked ? 'Like removed' : 'Story liked!',
        position: 'top',
        topOffset: 50,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update like',
        text2: error.message,
        position: 'top',
        topOffset: 50,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!userInfo) {
      Toast.show({
        type: 'error',
        text1: 'Please sign in to bookmark stories',
        position: 'top',
        topOffset: 50,
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

      Toast.show({
        type: !isBookmarked ? 'success' : 'info',
        text1: !isBookmarked ? 'Story bookmarked' : 'Bookmark removed',
        text2: !isBookmarked ? 'You can find it in your saved stories' : '',
        position: 'top',
        topOffset: 50,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update bookmark',
        text2: error.message,
        position: 'top',
        topOffset: 50,
      });
    }
  };

  const handleReadButton = async () => {
    try {
      if (!userInfo?.uid) {
        Toast.show({
          type: 'error',
          text1: 'Please sign in to read stories',
          position: 'top',
          topOffset: 50,
        });
        return;
      }

      try {
        await dispatch(updateStreak({ userId: userInfo.uid })).unwrap();
      } catch (streakError) {
        console.error('Error updating streak:', streakError);
      }

      navigation.navigate('Content', {
        slug: data.slug.current,
        category: data.category?.title,
      });
    } catch (error) {
      console.error('Error starting read:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start reading. Please try again.',
        position: 'top',
        topOffset: 50,
      });
    }
  };

  const handleOpenFontModal = () => {
    setFontModalVisible(true);
  };

  const handleCloseFontModal = () => {
    setFontModalVisible(false);
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
          <SettingsButton handleOpenModal={handleOpenFontModal} />
        </View>
      ),
    });
  }, [hasLiked, isLoading, isBookmarked]);

  return (
    <View style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Cover Image Section */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: data?.imageURL }} style={styles.coverImage} />
          <LinearGradient colors={['transparent', Colors.dark900]} style={styles.imageGradient} />
        </View>

        {/* Content Section */}
        <View style={styles.contentWrapper}>
          {/* Title and Level Section */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {data?.title}
            </Text>
            <View style={styles.levelTag}>
              <Text style={styles.levelText}>{data?.level}</Text>
            </View>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Icon name="time-outline" size={scale(18)} color={Colors.primary} />
              <Text style={styles.statText}>{formattedDuration}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Icon name="school" size={scale(18)} color={Colors.warning} />
              <Text style={styles.statText}>{difficultyText}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Icon name="heart" size={scale(18)} color={Colors.error} />
              <Text style={styles.statText}>{data?.likes}</Text>
            </View>
          </View>

          {/* Topics Section */}
          {data?.topics?.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.topicsContainer}
              contentContainerStyle={styles.topicsContent}
            >
              {data.topics.map((topic, index) => (
                <View key={index} style={styles.topicTag}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Author Badge */}
          <View style={styles.authorBadge}>
            <Image
              source={
                data?.author?.image
                  ? { uri: data.author.image }
                  : require('../../assets/images/blank-profile.png')
              }
              style={styles.authorImage}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorTitle}>Written by</Text>
              <Text style={styles.authorText}>{data?.author?.name || 'Unknown Author'}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{data?.description}</Text>
        </View>
      </ScrollView>

      {/* Start Reading Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.startButton} onPress={handleReadButton} activeOpacity={0.8}>
          <Icon name="book-outline" size={scale(22)} color={Colors.white} />
          <Text style={styles.buttonText}>Start Reading</Text>
        </TouchableOpacity>
      </View>

      <FontSettingsModal visible={isFontModalVisible} onClose={handleCloseFontModal} />
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
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
  },
  imageWrapper: {
    width: '100%',
    height: isSmallDevice ? hp(40) : hp(45),
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(20),
  },
  contentWrapper: {
    flex: 1,
    marginTop: -hp(4),
    paddingHorizontal: spacing.lg,
    paddingBottom: hp(12),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: isSmallDevice ? fontSizes.xxl : fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginRight: spacing.md,
    lineHeight: isSmallDevice ? scale(32) : scale(38),
  },
  levelTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(8),
    alignSelf: 'flex-start',
  },
  levelText: {
    color: Colors.primary,
    fontSize: isSmallDevice ? fontSizes.sm : fontSizes.md,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark800 + '80',
    padding: spacing.md,
    borderRadius: scale(12),
    marginBottom: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    color: Colors.white,
    fontSize: isSmallDevice ? fontSizes.sm : fontSizes.md,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: scale(20),
    backgroundColor: Colors.dark500,
  },
  topicsContainer: {
    marginBottom: spacing.lg,
  },
  topicsContent: {
    paddingRight: spacing.lg,
  },
  topicTag: {
    backgroundColor: Colors.dark800,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(16),
    marginRight: spacing.xs,
  },
  topicText: {
    color: Colors.gray300,
    fontSize: isSmallDevice ? fontSizes.xs : fontSizes.sm,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark800 + '80',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: scale(12),
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark700 + '40',
  },
  authorImage: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.dark700,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  authorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  authorTitle: {
    color: Colors.primary,
    fontSize: isSmallDevice ? fontSizes.xs : fontSizes.sm,
    marginBottom: 2,
  },
  authorText: {
    color: Colors.white,
    fontSize: isSmallDevice ? fontSizes.sm : fontSizes.md,
    fontWeight: '600',
  },
  description: {
    fontSize: isSmallDevice ? fontSizes.sm : fontSizes.md,
    color: Colors.gray300,
    lineHeight: scale(24),
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: Colors.dark900 + 'F0',
  },
  startButton: {
    backgroundColor: Colors.primary,
    height: isSmallDevice ? hp(6) : hp(7),
    borderRadius: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    color: Colors.white,
    fontSize: isSmallDevice ? fontSizes.lg : fontSizes.xl,
    fontWeight: '600',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
});
export default Detail;
