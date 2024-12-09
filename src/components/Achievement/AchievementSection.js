import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AchievementSection = ({ achievements }) => {
  return (
    <Animated.View entering={FadeInRight.delay(600)} style={styles.achievementsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {achievements.filter((a) => a.isUnlocked).length}/{achievements.length}
          </Text>
        </View>
      </View>
      <View style={styles.achievementsList}>
        {achievements.map((achievement, index) => (
          <AchievementCard key={achievement.id} achievement={achievement} delay={index * 100} />
        ))}
      </View>
    </Animated.View>
  );
};

const AchievementCard = ({ achievement, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInRight.delay(delay)} style={styles.cardContainer}>
      <LinearGradient
        colors={achievement.isUnlocked ? ['#2A2D3A', '#1F222E'] : ['#1F1F1F', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={[styles.iconContainer, achievement.isUnlocked && styles.unlockedIcon]}>
          <Icon
            name={achievement.icon}
            size={24}
            color={achievement.isUnlocked ? Colors.primary : Colors.gray500}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, achievement.isUnlocked && styles.unlockedText]}>
            {achievement.title}
          </Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>

        <View style={styles.statusContainer}>
          {achievement.isUnlocked ? (
            <Icon name="checkmark-circle" size={24} color={Colors.primary} />
          ) : (
            <Icon name="lock-closed" size={20} color={Colors.gray500} />
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  achievementsContainer: {
    padding: SCREEN_WIDTH * 0.04,
    marginTop: SCREEN_HEIGHT * 0.02,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  sectionTitle: {
    fontSize: SCREEN_HEIGHT * 0.024,
    fontWeight: '600',
    color: Colors.white,
  },
  progressBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    paddingVertical: SCREEN_HEIGHT * 0.006,
    borderRadius: 12,
  },
  progressText: {
    color: Colors.primary,
    fontSize: SCREEN_HEIGHT * 0.016,
    fontWeight: '600',
  },
  achievementsList: {
    gap: SCREEN_HEIGHT * 0.012,
  },
  cardContainer: {
    borderRadius: 12,
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
    padding: SCREEN_WIDTH * 0.04,
    gap: SCREEN_WIDTH * 0.03,
  },
  iconContainer: {
    width: SCREEN_WIDTH * 0.12,
    height: SCREEN_WIDTH * 0.12,
    borderRadius: SCREEN_WIDTH * 0.06,
    backgroundColor: Colors.dark900 + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedIcon: {
    backgroundColor: Colors.primary + '20',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: SCREEN_HEIGHT * 0.018,
    fontWeight: '600',
    color: Colors.gray500,
    marginBottom: 4,
  },
  unlockedText: {
    color: Colors.white,
  },
  description: {
    fontSize: SCREEN_HEIGHT * 0.014,
    color: Colors.gray500,
    lineHeight: SCREEN_HEIGHT * 0.02,
  },
  statusContainer: {
    marginLeft: SCREEN_WIDTH * 0.02,
  },
});
