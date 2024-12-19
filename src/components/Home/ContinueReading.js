import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import FormatReadTime from '../FormatReadTime';
import Icon from '../Icons';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';

const ContinueReading = ({ lastRead }) => {
  const navigation = useNavigation();
  const userStats = useSelector((state) => state.userStats.stats);
  const [readingHistory, setReadingHistory] = useState([]);

  // Get reading history sorted by progress
  useEffect(() => {
    if (userStats?.readingProgress) {
      // Convert reading progress to array and sort by progress
      const progressEntries = Object.entries(userStats.readingProgress)
        .map(([storyId, progress]) => ({
          storyId,
          progress,
        }))
        .sort((a, b) => b.progress - a.progress);

      setReadingHistory(progressEntries);
    }
  }, [userStats?.readingProgress]);

  if (!lastRead && !readingHistory.length) {
    return (
      <Animated.View entering={FadeIn.duration(800)} style={styles.emptyContainer}>
        <Icon name="book-outline" size={48} color={Colors.gray500} />
        <Text style={styles.warningText}>Start your reading journey!</Text>
        <Text style={styles.subText}>Your reading progress will appear here</Text>
      </Animated.View>
    );
  }

  const renderLastRead = () => {
    if (!lastRead) return null;

    const time = FormatReadTime(lastRead?.readTime);
    const progress = userStats?.readingProgress?.[lastRead._id] || 0;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('Detail', { data: lastRead })}
        activeOpacity={0.7}
      >
        <Animated.View entering={SlideInLeft.duration(600)} style={styles.lastReadCard}>
          <LinearGradient
            colors={[Colors.primary + '20', Colors.dark900]}
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
                <Text style={styles.cardLabel}>Continue Reading</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {lastRead.title}
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Icon name="time-outline" size={16} color={Colors.white} />
                    <Text style={styles.statText}>{time}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Icon name="book" size={16} color={Colors.primary} />
                    <Text style={styles.statText}>{Math.round(progress)}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item, index }) => {
    const tale = userStats?.completedStories?.find((story) => story._id === item.storyId);
    if (!tale) return null;

    return (
      <Animated.View entering={FadeIn.delay(index * 100)} style={styles.historyItemContainer}>
        <TouchableOpacity
          style={styles.historyItem}
          onPress={() => navigation.navigate('Detail', { data: tale })}
          activeOpacity={0.7}
        >
          <LinearGradient colors={[Colors.dark500, Colors.dark900]} style={styles.historyGradient}>
            <Image source={{ uri: tale.imageURL }} style={styles.historyImage} />
            <View style={styles.historyInfo}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {tale.title}
              </Text>
              <View style={styles.historyStats}>
                <Text style={styles.progressText}>{Math.round(item.progress)}% Complete</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.progress}%`,
                        backgroundColor: getProgressColor(item.progress),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getProgressColor = (progress) => {
    if (progress < 30) return Colors.primary;
    if (progress < 70) return Colors.warning;
    return Colors.success;
  };

  return (
    <View style={styles.container}>
      {renderLastRead()}

      {readingHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Reading History</Text>
          <FlatList
            data={readingHistory}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.storyId}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: Colors.dark500,
    borderRadius: scale(12),
    padding: spacing.lg,
    gap: spacing.md,
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
  lastReadCard: {
    borderRadius: scale(12),
    marginVertical: spacing.sm,
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
    gap: spacing.xs,
  },
  cardLabel: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  title: {
    color: Colors.white,
    fontSize: fontSizes.lg,
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
  historyContainer: {
    marginTop: spacing.lg,
  },
  historyTitle: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  historyList: {
    paddingHorizontal: spacing.xs,
  },
  historyItemContainer: {
    width: wp(60),
    marginRight: spacing.md,
  },
  historyItem: {
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  historyGradient: {
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyImage: {
    width: wp(15),
    height: wp(15),
    borderRadius: scale(8),
  },
  historyInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  historyTitle: {
    color: Colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  historyStats: {
    gap: spacing.xs,
  },
  progressText: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
  },
  progressBar: {
    height: scale(4),
    backgroundColor: Colors.dark700,
    borderRadius: scale(2),
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(2),
  },
});

export default ContinueReading;
