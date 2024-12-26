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
import { wp, hp, scale, fontSizes, spacing, layout } from '../utils/dimensions';
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
  const difficultyText = `${data?.difficulty}/5`;

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
        text1: 'Please login to like stories',
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
        text1: 'Please login to bookmark stories',
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
          text1: 'Please login to read stories',
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
      {/* Header gradient (for header) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      {/* Cover image and gradient */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: data?.imageURL }} style={styles.coverImage} />
        <LinearGradient colors={['transparent', Colors.dark900]} style={styles.imageGradient} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Level */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{data?.title}</Text>
          <View style={styles.levelTag}>
            <Text style={styles.levelText}>{data?.level}</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Icon name="time-outline" size={20} color={Colors.primary} />
            <Text style={styles.statText}>{formattedDuration}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Icon name="star" size={20} color={Colors.warning} />
            <Text style={styles.statText}>{difficultyText}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Icon name="heart" size={20} color={Colors.error} />
            <Text style={styles.statText}>{currentLikes}</Text>
          </View>
        </View>

        {/* Topics */}
        {data?.topics?.length > 0 && (
          <View style={styles.topicsRow}>
            {data.topics.map((topic, index) => (
              <View key={index} style={styles.topicTag}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Author */}
        <View style={styles.authorBadge}>
          <Text style={styles.authorText}>{data?.author?.name || 'Unknown Author'}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={3}>
          {data?.description}
        </Text>

        {/* Start Reading Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleReadButton}>
          <Icon name="book-outline" size={24} color={Colors.white} />
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
    height: hp(15),
    zIndex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.sm,
  },
  imageWrapper: {
    width: '100%',
    height: hp(45),
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
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl + scale(56),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginRight: spacing.md,
  },
  levelTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(8),
  },
  levelText: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark800 + '80',
    padding: spacing.md,
    borderRadius: scale(12),
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: scale(24),
    backgroundColor: Colors.dark500,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  topicTag: {
    backgroundColor: Colors.dark800,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(16),
  },
  topicText: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
  },
  authorBadge: {
    backgroundColor: 'rgba(45, 45, 45, 0.5)',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: scale(8),
    marginBottom: spacing.md,
  },
  authorText: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  description: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    lineHeight: scale(24),
    marginBottom: spacing.md,
  },
  startButton: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: Colors.primary,
    height: scale(56),
    borderRadius: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
});

export default Detail;
