import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { urlFor } from '../../sanity';
import StoryContent from '../components/Content/StoryContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import { Colors } from '../constants/colors';
import useGetTaleBySlug from '../hooks/useGetTaleBySlug';
import { useUserStats } from '../store/UserStatsContext';
import { useReadingProgress } from '../hooks/useReadingProgress';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import Icon from '../components/Icons';
import Toast from 'react-native-toast-message';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  fontSizes,
  layout,
  wp,
  hp,
} from '../utils/dimensions';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';

const SCROLL_THRESHOLD = verticalScale(200);

const Content = ({ route }) => {
  const { width, height } = useWindowDimensions();
  const { slug } = route.params;
  const { loading, error, tale } = useGetTaleBySlug(slug);
  const { startReading, updateReadingProgress, completeStory } = useUserStats();
  const { progress, scrollPosition, saveProgress, isCompleted } = useReadingProgress(
    slug,
    tale?.[0]
  );

  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const scrollViewRef = useRef(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasCompletedStory, setHasCompletedStory] = useState(false);

  const imageHeight = hp(50); // 50% of screen height
  const headerHeight = verticalScale(90);
  const paddingHorizontal = wp(5);

  useEffect(() => {
    startReading(slug);
    return () => {
      updateReadingProgress(slug, progress);
    };
  }, [slug]);

  const handleStoryCompletion = async () => {
    if (!hasCompletedStory) {
      try {
        await completeStory(slug);
        setHasCompletedStory(true);
        setTimeout(() => {
          Toast.show({
            type: 'success',
            text1: 'Congratulations! 🎉',
            text2: "You've completed this story!",
            position: 'bottom',
            visibilityTime: 3000,
          });
        }, 500);
      } catch (error) {
        console.error('Error completing story:', error);
      }
    }
  };

  const updateScrollButtonVisibility = useCallback((offsetY) => {
    setShowScrollTop(offsetY > SCROLL_THRESHOLD);
  }, []);

  const handleScroll = useCallback(
    async (offsetY) => {
      if (contentHeight.value > 0) {
        const newProgress = await saveProgress(offsetY, contentHeight.value, height);
        if (newProgress >= 95 && !hasCompletedStory) {
          handleStoryCompletion();
        }
      }
    },
    [contentHeight.value, height, hasCompletedStory]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(handleScroll)(event.contentOffset.y);
      runOnJS(updateScrollButtonVisibility)(event.contentOffset.y);
    },
  });

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: true,
    });
  };

  const headerStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(scrollY.value, [0, imageHeight * 0.7], [0, 1], 'clamp');
    return { opacity };
  });

  const onContentLayout = useCallback((event) => {
    contentHeight.value = event.nativeEvent.layout.height;
    setIsContentReady(true);
  }, []);

  useEffect(() => {
    if (isContentReady && scrollViewRef.current && scrollPosition > 0) {
      const timer = setTimeout(() => {
        scrollViewRef.current.scrollTo({ y: scrollPosition, animated: false });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isContentReady, scrollPosition]);

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;
  if (!tale || !tale[0]) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.stickyHeader, headerStyle, { height: headerHeight }]}>
        <HeaderNavbar title={tale[0]?.title} style={{ height: headerHeight }} />
      </Animated.View>

      <Animated.ScrollView
        ref={scrollViewRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        <Image
          source={{ uri: urlFor(tale[0].imageURL).url() }}
          style={[styles.headerImage, { height: imageHeight }]}
        />
        <Animated.View
          entering={FadeInDown.delay(400)}
          onLayout={onContentLayout}
          style={[styles.content, { paddingHorizontal }]}
        >
          <Text style={styles.title}>{tale[0]?.title}</Text>

          <StoryContent blocks={tale[0].content} />
        </Animated.View>
      </Animated.ScrollView>

      {showScrollTop && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrollTopButton}>
          <TouchableOpacity onPress={scrollToTop} style={styles.scrollTopTouchable}>
            <Icon name="arrow-up" size={scale(24)} color={Colors.white} />
          </TouchableOpacity>
        </Animated.View>
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  scrollView: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.dark900,
    justifyContent: 'center',
  },
  headerImage: {
    width: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.dark900,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: spacing.md,
    lineHeight: moderateScale(32),
  },
  progressContainer: {
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: Colors.dark500,
    borderRadius: scale(10),
  },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: Colors.dark900,
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(3),
  },
  progressText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  completedText: {
    color: Colors.success,
    fontWeight: '600',
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: scale(30),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollTopTouchable: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Content;
