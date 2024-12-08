import React, { useEffect, useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import { Colors } from '../constants/colors';
import useGetTaleBySlug from '../hooks/useGetTaleBySlug';
import { useUserStats } from '../store/UserStatsContext'; // Added this import
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../components/Icons';
import Toast from 'react-native-toast-message'; // Added this import
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

const SCROLL_THRESHOLD = 200;

const Content = ({ route }) => {
  const { width, height } = useWindowDimensions();
  const { slug } = route.params;
  const { loading, error, tale } = useGetTaleBySlug(slug);
  const { startReading, updateReadingProgress, completeStory } = useUserStats(); // Added useUserStats
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const scrollViewRef = useRef(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);

  const imageHeight = height * 0.5;
  const headerHeight = height * 0.12;
  const paddingHorizontal = width * 0.05;
  const titleSize = height * 0.035;
  const contentPadding = height * 0.03;

  useEffect(() => {
    setReadingStartTime(Date.now());
    startReading(slug);

    return () => {
      if (currentProgress === 100) {
        handleStoryCompletion();
      } else {
        updateReadingProgress(slug, currentProgress);
      }
    };
  }, [slug]);

  const handleStoryCompletion = async () => {
    try {
      await completeStory(slug);
      Toast.show({
        type: 'success',
        text1: 'Congratulations!',
        text2: "You've completed this story.",
      });
    } catch (error) {
      console.error('Error completing story:', error);
    }
  };

  const saveProgress = useCallback(
    async (offsetY) => {
      try {
        if (contentHeight.value <= 0) return;

        const scrollableHeight = contentHeight.value - height;
        if (scrollableHeight <= 0) return;

        const progress = Math.min(Math.max((offsetY / scrollableHeight) * 100, 0), 100);
        setCurrentProgress(progress);

        await Promise.all([
          AsyncStorage.setItem(`progress_${slug}`, progress.toString()),
          AsyncStorage.setItem(`scroll_${slug}`, offsetY.toString()),
        ]);

        if (progress >= 95) {
          handleStoryCompletion();
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    },
    [slug, height]
  );

  const updateScrollButtonVisibility = useCallback((offsetY) => {
    setShowScrollTop(offsetY > SCROLL_THRESHOLD);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
      runOnJS(saveProgress)(event.contentOffset.y);
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

  const restoreReadingPosition = useCallback(async () => {
    try {
      const savedPosition = await AsyncStorage.getItem(`scroll_${slug}`);
      if (savedPosition && scrollViewRef.current) {
        const position = parseFloat(savedPosition);
        scrollViewRef.current.scrollTo({ y: position, animated: false });
      }
    } catch (error) {
      console.error('Error restoring position:', error);
    }
  }, [slug]);

  const onContentLayout = useCallback((event) => {
    contentHeight.value = event.nativeEvent.layout.height;
    setIsContentReady(true);
  }, []);

  useEffect(() => {
    if (isContentReady && scrollViewRef.current) {
      const timer = setTimeout(() => {
        restoreReadingPosition();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isContentReady, restoreReadingPosition]);

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
          style={[
            styles.content,
            {
              paddingHorizontal,
              paddingVertical: contentPadding,
            },
          ]}
        >
          <Text style={[styles.title, { fontSize: titleSize, marginBottom: height * 0.02 }]}>
            {tale[0]?.title}
          </Text>

          {/* Added Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${currentProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(currentProgress)}% Read</Text>
          </View>

          <TaleContent style={styles.blocks} blocks={tale[0].content} />
        </Animated.View>
      </Animated.ScrollView>

      {showScrollTop && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrollTopButton}>
          <TouchableOpacity onPress={scrollToTop} style={styles.scrollTopTouchable}>
            <Icon name="arrow-up" size={24} color={Colors.white} />
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
  },
  title: {
    fontWeight: 'bold',
    color: Colors.white,
  },
  scrollTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollTopTouchable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: Colors.dark500,
    borderRadius: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.dark900,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    color: Colors.white,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default Content;
