import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { hp, wp, fontSizes } from '../utils/dimensions';
import Icon from '../components/Icons';

const AnimatedIcon = ({ name, size, color, delay = 0, duration = 1000 }) => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 80 }));
    rotate.value = withDelay(
      delay,
      withSequence(
        withTiming(360, { duration }),
        withTiming(340, { duration: 200 }),
        withTiming(350, { duration: 150 })
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Icon name={name} size={size} color={color} />
    </Animated.View>
  );
};

const FloatingParticle = ({ x, y, delay }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(-20, { duration: 1000 }), withTiming(0, { duration: 1000 })),
        -1
      )
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.particle, style]}>
      <Icon name="star" size={8} color={Colors.primary + '50'} />
    </Animated.View>
  );
};

const SplashScreen = ({ onAnimationComplete }) => {
  const textScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    textScale.value = withDelay(600, withSpring(1, { damping: 12 }));
    textOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 800 }));

    const timeout = setTimeout(() => {
      textOpacity.value = withTiming(0, { duration: 400 });
      subtitleOpacity.value = withTiming(0, { duration: 400 }, () => {
        runOnJS(onAnimationComplete)();
      });
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const textStyle = useAnimatedStyle(() => ({
    transform: [{ scale: textScale.value }],
    opacity: textOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <LinearGradient
      colors={[Colors.dark800, Colors.dark900]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background Particles */}
      {[...Array(6)].map((_, i) => (
        <FloatingParticle key={i} x={-50 + i * 20} y={0} delay={i * 200} />
      ))}

      <View style={styles.content}>
        {/* Main Icon */}
        <View style={styles.iconContainer}>
          <AnimatedIcon name="book" size={60} color={Colors.primary} />
        </View>

        {/* Secondary Icons */}
        <View style={styles.secondaryIcons}>
          <AnimatedIcon name="heart" size={24} color={Colors.error} delay={300} duration={800} />
          <AnimatedIcon name="star" size={24} color={Colors.warning} delay={400} duration={800} />
          <AnimatedIcon
            name="bookmark"
            size={24}
            color={Colors.primary}
            delay={500}
            duration={800}
          />
        </View>

        {/* Title and Subtitle */}
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
  iconContainer: {
    width: wp(28),
    height: wp(28),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: wp(14),
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  secondaryIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(6),
    marginTop: hp(3),
  },
  textContainer: {
    alignItems: 'center',
    marginTop: hp(3),
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
  },
});

export default SplashScreen;
