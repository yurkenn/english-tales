import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-swiper';
import Images from '../../components/Onboarding/ImageList';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';
import useOnboarding from '../../hooks/useOnboarding';

const OnboardingScreen = ({ navigation }) => {
  const { markOnboardingComplete } = useOnboarding();

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

  const handleGetStarted = async () => {
    await markOnboardingComplete();
    navigation.replace('Login');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const renderSlide = (item) => (
    <View style={styles.slide} key={item.id}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
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

      <View style={styles.buttonsContainer}>
        <CustomButton
          title="Get Started"
          onPress={handleGetStarted}
          style={styles.getStartedButton}
        />
        <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
          <Text style={styles.loginText}>Log In</Text>
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
  wrapper: {},
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hp(10),
  },
  image: {
    width: wp(100),
    height: hp(50),
    resizeMode: 'cover',
  },
  textContainer: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    textAlign: 'center',
    lineHeight: fontSizes.md * 1.5,
  },
  dot: {
    backgroundColor: Colors.white + '50',
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: spacing.xs,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    marginHorizontal: spacing.xs,
  },
  pagination: {
    position: 'absolute',
    bottom: hp(2),
  },
  buttonsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  getStartedButton: {
    marginBottom: spacing.md, // Added more margin for better spacing
    width: '100%',
  },
  loginButton: {
    marginTop: spacing.md, // Added top margin for better separation
  },
  loginText: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OnboardingScreen;
