// src/screens/Content.js
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/colors';
import { spacing, hp, fontSizes } from '../utils/dimensions';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import TaleHeader from '../components/Content/TaleHeader';
import StoryContent from '../components/Content/StoryContent';
import ScrollToTopButton from '../components/Content/ScrollToTopButton';

// Redux and Hooks
import { updateReadingProgress } from '../store/slices/userStatsSlice';
import useGetTaleBySlug from '../hooks/useGetTaleBySlug';
import { updateLastRead } from '../store/slices/readingProgressSlice';

const IMAGE_HEIGHT = hp(45);
const HEADER_HEIGHT = 80;
const PROGRESS_UPDATE_INTERVAL = 5000; // 5 seconds
const MINIMUM_READ_TIME = 10000; // 10 seconds before first progress update

const Content = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { slug, category } = route.params;
  const { loading, error, tale } = useGetTaleBySlug(slug);
  const userInfo = useSelector((state) => state.auth.user);
  const fontSize = useSelector((state) => state.fontSize.fontSize);

  // State and refs
  const [readStartTime] = useState(Date.now());
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isInitialProgress, setIsInitialProgress] = useState(true);
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef(null);
  const progressInterval = useRef(null);
  const contentHeight = useRef(0);
  const viewHeight = useRef(0);

  // Configure navigation header
  useEffect(() => {
    navigation.setOptions({
      headerTransparent: true,
      headerStyle: { backgroundColor: 'transparent' },
      headerTintColor: Colors.white,
      headerTitle: '',
    });
  }, [navigation]);

  // Header animation style
  const headerBackgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, IMAGE_HEIGHT - HEADER_HEIGHT], [0, 1], 'clamp'),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    backgroundColor: Colors.dark900,
    zIndex: 1,
  }));

  // Setup progress tracking
  useEffect(() => {
    if (!userInfo?.uid || !tale?.[0]?._id) return;

    const updateInterval = setInterval(() => {
      if (Date.now() - readStartTime >= MINIMUM_READ_TIME) {
        updateProgress();
      }
    }, PROGRESS_UPDATE_INTERVAL);

    progressInterval.current = updateInterval;

    return () => {
      clearInterval(updateInterval);
      // Save final progress when leaving
      if (!isInitialProgress) {
        updateProgress(true);
      }
    };
  }, [userInfo, tale, isInitialProgress]);

  const calculateProgress = () => {
    if (!contentHeight.current || !viewHeight.current) return 0;

    const currentOffset = scrollY.value;
    const maxScroll = contentHeight.current - viewHeight.current;

    if (maxScroll <= 0) return 100;

    const progress = (currentOffset / maxScroll) * 100;
    return Math.min(Math.round(progress), 100);
  };

  const calculateTimeSpent = () => {
    return Math.max(1, Math.round((Date.now() - readStartTime) / 60000)); // Minimum 1 minute
  };

  const updateProgress = async (isFinal = false) => {
    if (!userInfo?.uid || !tale?.[0]) return;

    try {
      const progress = isFinal ? 100 : calculateProgress();
      const timeSpent = calculateTimeSpent();

      // Only update if progress has changed or it's the final update
      if (progress !== currentProgress || isFinal) {
        setCurrentProgress(progress);
        setIsInitialProgress(false);

        await dispatch(
          updateReadingProgress({
            userId: userInfo.uid,
            storyId: tale[0]._id,
            progress,
            category: category || tale[0].categories?.[0]?.title,
            timeSpent,
          })
        ).unwrap();

        // Also update last read data
        if (progress > 0) {
          dispatch(
            updateLastRead({
              userId: userInfo.uid,
              storyData: {
                ...tale[0],
                progress,
                lastReadAt: new Date().toISOString(),
              },
            })
          );
        }

        // Show completion toast if the story is finished
        if (progress === 100) {
          Toast.show({
            type: 'success',
            text1: '🎉 Story Completed!',
            text2: 'Great job! Your progress has been saved.',
            visibilityTime: 3000,
            position: 'bottom',
            bottomOffset: 80,
            props: {
              style: {
                borderLeftColor: Colors.primary,
              },
            },
          });
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      Toast.show({
        type: 'error',
        text1: 'Error updating progress',
        text2: 'Your progress may not be saved',
        visibilityTime: 3000,
        position: 'bottom',
        bottomOffset: 80,
      });
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: () => {
      runOnJS(updateProgress)();
    },
  });

  const handleLayout = (event) => {
    viewHeight.current = event.nativeEvent.layout.height;
  };

  const handleContentSizeChange = (_, height) => {
    contentHeight.current = height;
  };

  const handleScrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Get current tale with null check
  const currentTale = tale && tale.length > 0 ? tale[0] : null;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !currentTale) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load the tale. Please try again later.</Text>
      </View>
    );
  }

  // Ensure all required properties exist with default values
  const {
    content = [],
    vocabulary = [],
    grammarFocus = [],
    interactiveElements = [],
    title = '',
    subtitle = '',
    author = null,
    imageURL = '',
    difficulty = ''
  } = currentTale;

  return (
    <View style={styles.container}>
      <Animated.View style={headerBackgroundStyle} />

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
      >
        <View style={[styles.imageContainer, { height: IMAGE_HEIGHT }]}>
          <TaleHeader imageURL={imageURL} difficulty={difficulty} />
          <LinearGradient colors={['transparent', Colors.dark900]} style={styles.gradientOverlay} />
        </View>

        <View style={styles.bookContainer}>
          <View style={styles.chapterInfo}>
            <Text style={styles.chapterTitle}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <StoryContent
            blocks={content}
            vocabulary={vocabulary}
            grammarFocus={grammarFocus}
            interactiveElements={interactiveElements}
            fontSize={fontSize}
          />

          {author && (
            <View style={styles.authorContainer}>
              <Text style={styles.authorName}>Written by {author.name}</Text>
              {author.bio && (
                <Text style={styles.authorBio}>{author.bio}</Text>
              )}
            </View>
          )}
        </View>
      </Animated.ScrollView>

      <ScrollToTopButton scrollY={scrollY} onPress={handleScrollToTop} />
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  bookContainer: {
    flex: 1,
    backgroundColor: Colors.dark900,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -spacing.xl,
    paddingTop: spacing.xl,
    minHeight: hp(100),
  },
  chapterInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  chapterTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontFamily: 'serif',
  },
  authorContainer: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: Colors.dark800,
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  authorName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.sm,
  },
  authorBio: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    lineHeight: fontSizes.lg,
  },
  errorText: {
    fontSize: fontSizes.md,
    color: Colors.white,
    textAlign: 'center',
    padding: spacing.lg,
  },
});

export default Content;
