import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { hp, wp, fontSizes } from '../utils/dimensions';
import Icon from '../components/Icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const Book3D = () => {
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 80,
    });

    rotateY.value = withRepeat(
      withSequence(
        withTiming(360, {
          duration: 2000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
        withTiming(0, {
          duration: 0,
        })
      ),
      -1
    );
  }, []);

  const coverStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 360], [0, 360]);

    return {
      transform: [{ perspective: 1000 }, { scale: scale.value }, { rotateY: `${rotate}deg` }],
    };
  });

  const pageStyle = useAnimatedStyle(() => {
    const rotate = interpolate(rotateY.value, [0, 360], [10, 370]);

    const opacity = interpolate(rotateY.value, [0, 90, 270, 360], [1, 0, 0, 1]);

    return {
      opacity,
      transform: [{ perspective: 1000 }, { scale: scale.value * 0.9 }, { rotateY: `${rotate}deg` }],
    };
  });

  return (
    <View style={styles.bookContainer}>
      {/* Pages */}
      {[...Array(3)].map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.page,
            pageStyle,
            {
              zIndex: 2 - i,
              transform: [{ translateX: i * 2 }],
            },
          ]}
        >
          {[...Array(5)].map((_, lineIndex) => (
            <View
              key={`line-${lineIndex}`}
              style={[
                styles.pageLine,
                {
                  top: lineIndex * wp(5) + wp(8),
                },
              ]}
            />
          ))}
          <Text
            style={[
              styles.pageText,
              {
                top: wp(15),
                left: wp(5),
              },
            ]}
          >
            Once upon a time...
          </Text>
          <Text
            style={[
              styles.pageText,
              {
                top: wp(25),
                right: wp(3),
              },
            ]}
          >
            Chapter {i + 1}
          </Text>
        </Animated.View>
      ))}

      {/* Book Cover */}
      <Animated.View style={[styles.cover, coverStyle]}>
        <Icon name="book" size={40} color={Colors.white} />
      </Animated.View>
    </View>
  );
};

const InteractiveParticle = ({ delay, x, y }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(x);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const bookCenterX = SCREEN_WIDTH / 2;
    const bookCenterY = SCREEN_HEIGHT / 2;

    scale.value = withDelay(delay, withSpring(1, { damping: 10 }));

    // Kitaba doğru hareket
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(bookCenterY - y - 100, {
            duration: 3000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(0, {
            duration: 3000,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        -1
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(bookCenterX - x - 50, { duration: 3000 }),
          withTiming(x, { duration: 3000 })
        ),
        -1
      )
    );

    // Kitaba yaklaşırken parlama ve kaybolma
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(0.2, { duration: 1500 }), withTiming(1, { duration: 1500 })),
        -1
      )
    );

    rotate.value = withDelay(delay, withRepeat(withTiming(360, { duration: 3000 }), -1));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, style]}>
      <LinearGradient
        colors={[Colors.primary, Colors.primary + '40']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.particleGradient}
      />
    </Animated.View>
  );
};

const GlowEffect = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.6, { duration: 1500 }), withTiming(0.3, { duration: 1500 })),
      -1
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.glow, style]}>
      <LinearGradient
        colors={[Colors.primary + '00', Colors.primary + '40']}
        style={styles.glowGradient}
        radial
      />
    </Animated.View>
  );
};

const SplashScreen = ({ onAnimationComplete }) => {
  const textOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    textOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));

    subtitleOpacity.value = withDelay(1200, withTiming(1, { duration: 1000 }));

    const timeout = setTimeout(() => {
      textOpacity.value = withTiming(0, { duration: 500 });
      subtitleOpacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(onAnimationComplete)();
      });
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: interpolate(textOpacity.value, [0, 1], [20, 0]) }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: interpolate(subtitleOpacity.value, [0, 1], [20, 0]) }],
  }));

  return (
    <LinearGradient
      colors={[Colors.dark800, Colors.dark900]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background Particles */}
      {[...Array(8)].map((_, i) => (
        <InteractiveParticle
          key={i}
          delay={i * 200}
          x={-SCREEN_WIDTH / 2 + (i * SCREEN_WIDTH) / 4}
          y={0}
        />
      ))}

      <GlowEffect />

      <View style={styles.content}>
        <Book3D />

        <View style={styles.textContainer}>
          <Animated.Text style={[styles.title, textStyle]}>English Tales</Animated.Text>
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Your Reading Journey Begins
          </Animated.Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  bookContainer: {
    width: wp(40),
    height: wp(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: wp(28),
    height: wp(36),
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  page: {
    width: wp(27),
    height: wp(35),
    backgroundColor: Colors.white,
    borderRadius: 6,
    position: 'absolute',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: hp(4),
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: fontSizes.lg,
    color: Colors.gray300,
    marginTop: hp(1),
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  particleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  glow: {
    position: 'absolute',
    width: wp(100),
    height: hp(100),
    zIndex: -1,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
