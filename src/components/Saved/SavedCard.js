import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideOutRight } from 'react-native-reanimated';
import Icon from '../Icons';
import { wp, hp, moderateScale, fontSizes, spacing, layout } from '../../utils/dimensions';

const SavedCard = ({ data, onDelete }) => {
  return (
    <Animated.View entering={FadeIn} exiting={SlideOutRight} style={styles.container}>
      <LinearGradient
        colors={['#1F1F1F', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.Image source={{ uri: data?.imageURL }} style={styles.image} />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {data?.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {data?.description}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Icon name="time-outline" size={moderateScale(16)} color={Colors.white} />
              <Text style={styles.statText}>{data?.readTime}m</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="heart" size={moderateScale(16)} color={Colors.red} />
              <Text style={styles.statText}>{data?.likes}</Text>
            </View>
            <Pressable onPress={() => onDelete(data)} style={styles.deleteButton}>
              <Icon name="trash-outline" size={moderateScale(20)} color={Colors.red} />
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: hp(2),
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    flexDirection: 'row',
    padding: spacing.sm,
  },
  image: {
    width: wp(25),
    height: hp(15),
    borderRadius: layout.borderRadius,
  },
  content: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: hp(1),
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    lineHeight: hp(2.2),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
  },
  statText: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    marginLeft: spacing.xs,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: spacing.sm,
  },
});

export default SavedCard;
