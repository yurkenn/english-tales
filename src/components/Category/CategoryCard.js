import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import Icon from '../Icons';
import { scale, verticalScale, moderateScale, spacing, fontSizes } from '../../utils/dimensions';

const CategoryCard = ({ data }) => {
  const navigation = useNavigation();
  const formattedDuration = `${data?.estimatedDuration}m`;

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Detail', { data })} activeOpacity={0.7}>
      <LinearGradient
        colors={[data?.category?.color || '#1F1F1F', Colors.dark900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.Image source={{ uri: data?.imageURL }} style={styles.image} />

        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {data?.title}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{data?.level}</Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={3}>
            {data?.description}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="time" size={scale(16)} color={Colors.white} />
              <Text style={styles.statText}>{formattedDuration}</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="heart" size={scale(16)} color={Colors.red} />
              <Text style={styles.statText}>{data?.likes}</Text>
            </View>
            <View style={styles.difficultyContainer}>
              <Icon name="star" size={scale(16)} color={Colors.warning} />
              <Text style={styles.statText}>{data?.difficulty}/5</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
    padding: spacing.md,
    borderRadius: scale(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: scale(100),
    height: verticalScale(150),
    borderRadius: scale(8),
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: verticalScale(8),
    marginRight: spacing.sm,
  },
  levelBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: scale(4),
  },
  levelText: {
    color: Colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    lineHeight: verticalScale(22),
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: verticalScale(8),
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
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginLeft: 'auto',
  },
});

export default CategoryCard;
