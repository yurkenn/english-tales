// src/components/Saved/SavedCard.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { wp, hp, moderateScale, fontSizes, spacing } from '../../utils/dimensions';

const SavedCard = ({ data, onDelete, onPress }) => {
  return (
    <Animated.View entering={FadeInDown} style={styles.cardContainer}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <LinearGradient
          colors={['#2A2D3A', '#1F222E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Animated.Image source={{ uri: data?.imageURL }} style={styles.image} />

          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{data?.category.title || 'Story'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onDelete(data)}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="trash-outline" size={moderateScale(20)} color={Colors.error} />
              </TouchableOpacity>
            </View>

            <Text style={styles.title} numberOfLines={2}>
              {data?.title}
            </Text>

            <Text style={styles.description} numberOfLines={2}>
              {data?.description}
            </Text>

            <View style={styles.footer}>
              <View style={styles.readButton}>
                <Text style={styles.readButtonText}>Continue Reading</Text>
                <Icon name="arrow-forward" size={moderateScale(16)} color={Colors.primary} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: spacing.md,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  image: {
    width: wp(25),
    height: hp(15),
    borderRadius: moderateScale(12),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: moderateScale(6),
  },
  categoryText: {
    color: Colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.xs,
    lineHeight: fontSizes.lg * 1.3,
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    lineHeight: fontSizes.md * 1.2,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  readButtonText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default SavedCard;
