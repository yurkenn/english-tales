import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import Images from '../../components/Onboarding/ImageList';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '../../components/CustomButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { scale, verticalScale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';

const OnboardingScreen = ({ navigation }) => {
  const slides = [
    {
      id: 1,
      title: 'Explore Diverse Tales',
      description:
        'Discover a wide range of tales spanning different categories, including fantasy, nature, animals, and more.',
      image: Images.first,
    },
    {
      id: 2,
      title: 'Personalized Experience',
      description: 'Create your own library by saving your favorite tales for later enjoyment.',
      image: Images.second,
    },
    {
      id: 3,
      title: 'Read Anywhere, Anytime',
      description:
        'Enjoy your favorite tales on the go, at home, or anywhere else. All you need is an internet connection.',
      image: Images.third,
    },
  ];

  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const renderSlide = (item) => (
    <Animated.View
      entering={FadeInDown.duration(1000).springify()}
      style={styles.slideContainer}
      key={item.id}
    >
      <Image source={item.image} style={styles.image} />
      <LinearGradient colors={['transparent', Colors.dark900]} style={styles.textGradient}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Swiper
        style={styles.wrapper}
        dotStyle={styles.dot}
        activeDotStyle={styles.activeDot}
        paginationStyle={styles.pagination}
        loop={false}
        autoplay={false}
      >
        {slides.map((slide) => renderSlide(slide))}
      </Swiper>

      <LinearGradient
        colors={[Colors.dark900 + '00', Colors.dark900]}
        style={styles.buttonsContainer}
      >
        <CustomButton
          title="Get Started"
          onPress={handleGetStarted}
          style={styles.getStartedButton}
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  wrapper: {},
  slideContainer: {
    flex: 1,
  },
  image: {
    width: wp(100),
    height: hp(100),
    resizeMode: 'cover',
  },
  textGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: hp(15),
    paddingBottom: hp(20),
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSizes.lg,
    color: Colors.gray300,
    lineHeight: fontSizes.lg * 1.5,
  },
  dot: {
    backgroundColor: Colors.white + '50',
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: spacing.xs,
  },
  activeDot: {
    backgroundColor: Colors.white,
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: spacing.xs,
  },
  pagination: {
    position: 'absolute',
    bottom: hp(15),
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: hp(10),
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  getStartedButton: {
    marginBottom: spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  loginText: {
    color: Colors.gray300,
    fontSize: fontSizes.md,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default OnboardingScreen;
