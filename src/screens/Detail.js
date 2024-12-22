import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/colors';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import HeaderButtons from '../components/Detail/HeaderButtons';
import FontSettingsModal from '../components/Modal/FontSettingsModal';
import Icon from '../components/Icons';
import { wp, hp, scale, fontSizes, spacing } from '../utils/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { toggleBookmark } from '../store/slices/bookmarkSlice';
import { toggleLike } from '../store/slices/likeSlice';
import { updateStreak } from '../store/slices/userStatsSlice';

const Detail = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { data } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Redux selectors
  const userInfo = useSelector((state) => state.auth.user);
  const bookmarks = useSelector((state) => state.bookmarks.bookmarks);
  const userLikes = useSelector((state) => state.likes.userLikes);
  const likes = useSelector((state) => state.likes.likes);

  // Format values
  const formattedDuration = `${data?.estimatedDuration} min`;
  const difficultyText = `${data?.difficulty}/5`;
  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark?.slug?.current === data?.slug?.current
  );
  const hasLiked = userLikes[data._id] || false;
  const currentLikes = likes[data._id] || 0;

  const handleLike = async () => {
    if (!userInfo) {
      Toast.show({ type: 'error', text1: 'Please login to like stories' });
      return;
    }

    try {
      await dispatch(toggleLike({ taleId: data._id, currentLikes })).unwrap();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update like', text2: error.message });
    }
  };

  const handleBookmark = async () => {
    if (!userInfo) {
      Toast.show({ type: 'error', text1: 'Please login to bookmark stories' });
      return;
    }

    try {
      await dispatch(toggleBookmark({ bookData: data, userId: userInfo.uid })).unwrap();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update bookmark', text2: error.message });
    }
  };

  const handleReadButton = async () => {
    if (!userInfo?.uid) {
      Toast.show({ type: 'error', text1: 'Please login to read stories' });
      return;
    }

    try {
      await dispatch(updateStreak({ userId: userInfo.uid })).unwrap();
      navigation.navigate('Content', {
        slug: data.slug.current,
        category: data.category?.title,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to start reading. Please try again.',
      });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />

      <HeaderButtons
        scrollY={scrollY}
        hasLiked={hasLiked}
        isLoading={isLoading}
        handleLike={handleLike}
        isBookmarked={isBookmarked}
        handleBookmark={handleBookmark}
        handleOpenModal={() => setShowFontSettings(true)}
      />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <View style={styles.imageWrapper}>
          <Image source={{ uri: data?.imageURL }} style={styles.coverImage} />
          <LinearGradient colors={['transparent', Colors.dark900]} style={styles.imageGradient} />
        </View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)} style={styles.titleContainer}>
            <Text style={styles.title}>{data?.title}</Text>
            <View style={[styles.levelTag, { backgroundColor: Colors.primary + '15' }]}>
              <Text style={[styles.levelText, { color: Colors.primary }]}>{data?.level}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.iconWrapper, { backgroundColor: Colors.primary + '15' }]}>
                <Icon name="time-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statText}>{formattedDuration}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.iconWrapper, { backgroundColor: Colors.warning + '15' }]}>
                <Icon name="star" size={20} color={Colors.warning} />
              </View>
              <Text style={styles.statText}>{difficultyText}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.iconWrapper, { backgroundColor: Colors.error + '15' }]}>
                <Icon name="heart" size={20} color={Colors.error} />
              </View>
              <Text style={styles.statText}>{currentLikes}</Text>
            </View>
          </Animated.View>

          {data?.topics?.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.topicsContainer}>
              {data.topics.map((topic, index) => (
                <View key={index} style={styles.topicTag}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(400)} style={styles.authorContainer}>
            <LinearGradient colors={[Colors.dark800, Colors.dark900]} style={styles.authorCard}>
              <Icon name="person" size={20} color={Colors.primary} />
              <Text style={styles.authorText}>{data?.author?.name || 'Unknown Author'}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500)}>
            <Text style={styles.description}>{data?.description}</Text>
          </Animated.View>

          <TouchableOpacity style={styles.startButton} onPress={handleReadButton}>
            <LinearGradient
              colors={[Colors.primary, Colors.primary700]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Icon name="book-outline" size={24} color={Colors.white} />
              <Text style={styles.buttonText}>Start Reading</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      <FontSettingsModal visible={showFontSettings} onClose={() => setShowFontSettings(false)} />
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
    padding: spacing.xl,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginRight: spacing.md,
    letterSpacing: 0.3,
  },
  levelTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(20),
  },
  levelText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: Colors.dark800 + '40',
    borderRadius: scale(16),
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrapper: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: scale(30),
    backgroundColor: Colors.dark500,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  topicTag: {
    backgroundColor: Colors.dark800 + '80',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: scale(20),
  },
  topicText: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
  },
  authorContainer: {
    marginBottom: spacing.lg,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: scale(12),
    alignSelf: 'flex-start',
  },
  authorText: {
    color: Colors.white,
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  description: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    lineHeight: scale(24),
    marginBottom: spacing.xl,
  },
  startButton: {
    marginTop: spacing.md,
    borderRadius: scale(12),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  buttonText: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
});

export default Detail;
