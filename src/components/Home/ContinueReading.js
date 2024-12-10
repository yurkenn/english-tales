import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import FormatReadTime from '../FormatReadTime';
import Icon from '../Icons';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  fontSizes,
  wp,
  hp,
  isSmallDevice,
} from '../../utils/dimensions';

const ContinueReading = ({ lastRead }) => {
  const navigation = useNavigation();
  const time = FormatReadTime(lastRead?.readTime);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    if (lastRead) {
      loadReadingProgress();
    }
  }, [lastRead]);

  const loadReadingProgress = async () => {
    try {
      const progress = await AsyncStorage.getItem(`progress_${lastRead.slug.current}`);
      if (progress !== null) {
        setReadingProgress(parseFloat(progress));
      }
    } catch (error) {
      console.error('Error loading reading progress:', error);
    }
  };

  // Calculate the percentage based on content length and current position
  const formatProgress = (progress) => {
    return `${Math.round(progress)}%`;
  };

  if (!lastRead) {
    return (
      <Animated.View entering={FadeIn.duration(800)} style={styles.emptyContainer}>
        <Icon name="book-outline" size={48} color={Colors.gray500} />
        <Text style={styles.warningText}>Start your reading journey!</Text>
        <Text style={styles.subText}>Your last read story will appear here</Text>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Detail', { data: lastRead })}
      activeOpacity={0.7}
    >
      <Animated.View entering={SlideInLeft.duration(600)} style={styles.container}>
        <LinearGradient
          colors={[Colors.dark500, Colors.dark900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.imageContainer}>
            <Image source={{ uri: lastRead.imageURL }} style={styles.image} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={styles.imageOverlay}
            />
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title} numberOfLines={2}>
                {lastRead.title}
              </Text>
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Icon name="time-outline" size={16} color={Colors.white} />
                  <Text style={styles.statText}>{time}</Text>
                </View>
                <View style={styles.stat}>
                  <Icon name="heart" size={16} color={Colors.red} />
                  <Text style={styles.statText}>{lastRead.likes}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
              {lastRead.description}
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progress,
                    {
                      width: `${readingProgress}%`,
                      backgroundColor: getProgressColor(readingProgress),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{formatProgress(readingProgress)} completed</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Helper function to get progress color based on percentage
const getProgressColor = (progress) => {
  if (progress < 30) return Colors.primary;
  if (progress < 70) return Colors.warning;
  return Colors.success;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: scale(12),
    marginVertical: verticalScale(8),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  imageContainer: {
    width: wp(33),
    position: 'relative',
  },
  image: {
    height: wp(40),
    width: '100%',
    borderRadius: scale(8),
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: scale(8),
  },
  infoContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  headerContainer: {
    gap: verticalScale(8),
  },
  title: {
    color: Colors.white,
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: scale(16),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  statText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
  },
  description: {
    color: Colors.gray500,
    fontSize: fontSizes.sm,
    lineHeight: moderateScale(20),
  },
  progressContainer: {
    gap: verticalScale(4),
  },
  progressBar: {
    height: verticalScale(6),
    backgroundColor: Colors.dark500,
    borderRadius: scale(3),
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: scale(3),
  },
  progressText: {
    color: Colors.gray500,
    fontSize: fontSizes.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: Colors.dark500,
    borderRadius: scale(12),
    padding: spacing.lg,
    gap: verticalScale(12),
  },
  warningText: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  subText: {
    color: Colors.gray500,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});

export default ContinueReading;
