// src/screens/Detail.js
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BookmarkButton from '../components/BookmarkButton';
import LikeButton from '../components/Detail/LikeButton';
import SettingsButton from '../components/Detail/SettingsButton';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { urlFor } from '../../sanity';
import Icon from '../components/Icons';
import { wp, hp, scale, fontSizes, spacing, layout } from '../utils/dimensions';

// Redux imports
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../store/slices/bookmarkSlice';
import { toggleLike, fetchTaleLikes } from '../store/slices/likeSlice';
import { updateStreak } from '../store/slices/userStatsSlice';
import { selectUser, selectBookmarks, selectUserLikes, selectLikes } from '../store/selectors';
import FontSizeSettings from '../components/Modal/FontSizeSettings';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Detail = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { data } = route.params;

  // Redux selectors
  const userInfo = useSelector(selectUser);
  const bookmarks = useSelector(selectBookmarks);
  const userLikes = useSelector(selectUserLikes);
  const likes = useSelector(selectLikes);

  const bottomSheetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Format values
  const formattedDuration = `${data?.estimatedDuration} min`;
  const difficultyText = `${data?.difficulty}/5`;
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

      const lastReadData = {
        ...data,
        imageURL: data.imageURL ? urlFor(data.imageURL).url() : null,
        progress: 0,
        lastReadAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(`lastRead_${userInfo.uid}`, JSON.stringify(lastReadData));

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
      console.error('Error saving last read:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start reading. Please try again.',
      });
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
      {/* Üst gradient (header için) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      {/* Resim ve alt gradient */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: data?.imageURL }} style={styles.coverImage} />
        <LinearGradient colors={['transparent', Colors.dark900]} style={styles.imageGradient} />
      </View>

      {/* İçerik */}
      <View style={styles.content}>
        {/* Başlık ve Level */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{data?.title}</Text>
          <View style={styles.levelTag}>
            <Text style={styles.levelText}>{data?.level}</Text>
          </View>
        </View>

        {/* İstatistikler */}
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

        {/* Konular */}
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

        {/* Açıklama */}
        <Text style={styles.description}>{data?.description}</Text>

        {/* Başla Butonu */}
        <TouchableOpacity style={styles.startButton} onPress={handleReadButton}>
          <Icon name="book-outline" size={24} color={Colors.white} />
          <Text style={styles.buttonText}>Start Reading</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 12,
  },
  levelTag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark800 + '80',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.dark500,
  },
  topicsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  topicTag: {
    backgroundColor: Colors.dark800,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicText: {
    color: Colors.gray300,
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: Colors.gray300,
    lineHeight: 24,
    marginBottom: 16,
  },
  authorBadge: {
    backgroundColor: 'rgba(45, 45, 45, 0.5)',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  authorText: {
    color: Colors.gray300,
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Detail;
