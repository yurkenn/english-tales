// src/components/Achievement/AchievementSection.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { wp, hp, fontSizes, spacing, layout } from '../../utils/dimensions';

const AchievementCard = ({ achievement, delay = 0 }) => {
  const { isUnlocked, progress = 0 } = achievement;

  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.cardContainer}>
      <LinearGradient
        colors={isUnlocked ? ['#2A2D3A', '#1F222E'] : ['#1F1F1F', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.iconContainer, isUnlocked && styles.unlockedIcon]}>
          <Icon
            name={achievement.icon}
            size={24}
            color={isUnlocked ? Colors.primary : Colors.gray500}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, isUnlocked && styles.unlockedText]}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>

          {!isUnlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{`${progress}%`}</Text>
            </View>
          )}
        </View>

        <View style={styles.statusContainer}>
          {isUnlocked ? (
            <Icon name="checkmark-circle" size={24} color={Colors.primary} />
          ) : (
            <Icon name="lock-closed" size={20} color={Colors.gray500} />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export const AchievementSection = ({ achievements = [] }) => {
  if (!achievements?.length) return null;

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {unlockedCount}/{achievements.length}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {achievements.map((achievement, index) => (
          <AchievementCard key={achievement.id} achievement={achievement} delay={index * 100} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  progressBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: layout.borderRadius,
  },
  progressText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  list: {
    gap: spacing.md,
  },
  cardContainer: {
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: Colors.dark900 + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedIcon: {
    backgroundColor: Colors.primary + '20',
  },
  contentContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Colors.gray500,
  },
  unlockedText: {
    color: Colors.white,
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    lineHeight: fontSizes.md * 1.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: hp(0.8),
    backgroundColor: Colors.dark900,
    borderRadius: hp(0.4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: fontSizes.xs,
    color: Colors.gray500,
    width: wp(8),
  },
  statusContainer: {
    marginLeft: spacing.sm,
  },
});

export default AchievementSection;
