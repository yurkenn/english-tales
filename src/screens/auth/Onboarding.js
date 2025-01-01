import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { wp, hp, scale, spacing, fontSizes } from '../../utils/dimensions';
import Icon from '../../components/Icons';
import useOnboarding from '../../hooks/useOnboarding';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    icon: 'book',
    title: 'Welcome to\nEnglish Tales',
    subtitle: 'Explore Diverse Tales',
    description: 'Discover a world of tales across genres.',
    image: require('../../../assets/images/onboarding/onboarding1.png'),
  },
  {
    id: 2,
    icon: 'bookmark',
    title: 'Your Journey\nYour Tales',
    subtitle: 'Personalized Experience',
    description: 'Save your favorite tales for later.',
    image: require('../../../assets/images/onboarding/onboarding2.png'),
  },
  {
    id: 3,
    icon: 'globe',
    title: 'Read\nAnywhere',
    subtitle: 'Always Available',
    description: 'Enjoy tales on the go with an internet connection.',
    image: require('../../../assets/images/onboarding/onboarding3.png'),
  },
];

const OnboardingSlide = ({ item, index, scrollX }) => {
  const inputRange = [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH];

  const imageAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollX.value, inputRange, [0.8, 1, 0.8], Extrapolate.CLAMP),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0.5, 1, 0.5], Extrapolate.CLAMP),
  }));

  const contentAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollX.value, inputRange, [50, 0, 50], Extrapolate.CLAMP),
      },
    ],
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolate.CLAMP),
      },
      {
        rotate: `${interpolate(scrollX.value, inputRange, [-30, 0, 30], Extrapolate.CLAMP)}deg`,
      },
    ],
  }));

  return (
    <View style={styles.slide}>
      <Animated.Image
        source={item.image}
        style={[styles.image, imageAnimStyle]}
        resizeMode="cover"
        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
      />
      <LinearGradient
        colors={['transparent', 'rgba(22,22,22,0.8)', Colors.dark900]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.contentWrapper}>
          <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
            <Icon name={item.icon} size={scale(32)} color={Colors.primary} />
          </Animated.View>

          <Animated.View style={[styles.content, contentAnimStyle]}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
};

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const buttonScale = useSharedValue(1);
  const scrollX = useSharedValue(0);
  const scrollViewRef = React.useRef(null);
  const { markOnboardingComplete } = useOnboarding();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: (event) => {
      const newIndex = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(setCurrentIndex)(newIndex);
    },
  });

  const handleNext = useCallback(async () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      await markOnboardingComplete();
      navigation.navigate('Auth');
    }
  }, [currentIndex, markOnboardingComplete]);

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring(
      interpolate(
        scrollX.value,
        [0, SCREEN_WIDTH * (SLIDES.length - 1)],
        [SCREEN_WIDTH * 0.25, SCREEN_WIDTH * 0.9],
        Extrapolate.CLAMP
      ),
      { damping: 20, stiffness: 90 }
    ),
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <OnboardingSlide key={slide.id} item={slide} index={index} scrollX={scrollX} />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, progressStyle]} />
        </View>

        <View style={styles.buttons}>
          {currentIndex < SLIDES.length - 1 ? (
            <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <Animated.View
            style={[
              styles.nextButtonContainer,
              useAnimatedStyle(() => ({
                transform: [{ scale: buttonScale.value }],
              })),
            ]}
          >
            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              onPressIn={() => {
                buttonScale.value = withSpring(0.95);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primary700]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.nextText}>
                  {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                <Icon name="arrow-forward" size={scale(20)} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7, // Limit height to 70% of screen
    position: 'absolute',
    top: 0,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7, // Match image height
    justifyContent: 'flex-end',
    paddingBottom: hp(25),
  },
  contentWrapper: {
    padding: spacing.xl,
    paddingVertical: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: scale(20),
    marginBottom: hp(5),
  },
  iconContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: fontSizes.xxxl * 1.2,
  },
  subtitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.primary,
  },
  description: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    lineHeight: fontSizes.md * 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
  },
  progressContainer: {
    width: '100%',
    height: scale(4),
    backgroundColor: Colors.dark500,
    borderRadius: scale(2),
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: scale(2),
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: spacing.md,
  },
  skipText: {
    color: Colors.gray300,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  nextButtonContainer: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  nextButton: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  nextText: {
    color: Colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
};

export default OnboardingScreen;
