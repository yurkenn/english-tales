import React, { useState } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, scale, spacing, fontSizes } from '../../utils/dimensions';
import { Colors } from '../../constants/colors';
import {
  ReadingGlassesSVG,
  BookReadingSVG,
  LearningProcessSVG,
} from '../../components/Onboarding/ImageList';

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to\nEnglish Tales',
    subtitle: 'Explore Diverse Tales',
    description: 'Discover a world of stories across genres.',
    SvgComponent: ReadingGlassesSVG,
  },
  {
    id: 2,
    title: 'Your Journey\nYour Stories',
    subtitle: 'Personalized Experience',
    description: 'Save your favorite tales for later.',
    SvgComponent: BookReadingSVG,
  },
  {
    id: 3,
    title: 'Read\nAnywhere',
    subtitle: 'Always Available',
    description: 'Enjoy tales on the go with an internet connection.',
    SvgComponent: LearningProcessSVG,
  },
];

const Onboarding = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <item.SvgComponent />
      </View>
      <LinearGradient colors={['transparent', Colors.dark900]} style={styles.gradient}>
        <Animated.View entering={FadeInDown.duration(800)} style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressBar,
            {
              width: wp(25),
              backgroundColor: index === activeIndex ? Colors.primary : Colors.dark700,
            },
          ]}
        />
      ))}
    </View>
  );

  const handleNext = () => {
    if (activeIndex === onboardingData.length - 1) {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Carousel
        data={onboardingData}
        renderItem={renderItem}
        width={wp(100)}
        height={hp(100)}
        onSnapToItem={setActiveIndex}
        mode="parallax"
      />

      <View style={styles.footer}>
        {renderProgress()}

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>
              {activeIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  slide: {
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(10),
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: hp(15),
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSizes.xxxl,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: spacing.sm,
    lineHeight: fontSizes.xxxl * 1.2,
  },
  subtitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: spacing.md,
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
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: scale(4),
    borderRadius: scale(2),
  },
  actions: {
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
  nextButton: {
    backgroundColor: Colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: scale(8),
  },
  nextText: {
    color: Colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default Onboarding;
