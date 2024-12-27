import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes } from '../../utils/dimensions';

const SavedCard = ({ data, onDelete, onPress, index }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.98))}
        onPressOut={() => (scale.value = withSpring(1))}
        activeOpacity={1}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: data?.imageURL }} style={styles.image} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.overlay} />
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: data?.category?.color || Colors.primary },
              ]}
            >
              <Text style={styles.levelText}>{data?.level}</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={2}>
                {data?.title}
              </Text>
              <TouchableOpacity
                onPress={() => onDelete(data)}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <LinearGradient
                  colors={[Colors.dark700, Colors.dark900]}
                  style={styles.deleteButtonGradient}
                >
                  <Icon name="trash-outline" size={20} color={Colors.error} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.stats}>
              <Icon name="time" size={16} color={data?.category?.color || Colors.primary} />
              <Text style={styles.statText}>{data?.estimatedDuration}m</Text>
              <View style={styles.dot} />
              <Icon name="heart" size={16} color={Colors.error} />
              <Text style={styles.statText}>{data?.likes || 0}</Text>
            </View>

            <TouchableOpacity style={styles.continueBtn}>
              <Text
                style={[styles.continueText, { color: data?.category?.color || Colors.primary }]}
              >
                Continue Reading
              </Text>
              <Icon
                name="arrow-forward"
                size={16}
                color={data?.category?.color || Colors.primary}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = {
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  card: {
    backgroundColor: Colors.dark800,
    borderRadius: scale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark700,
  },
  imageContainer: {
    height: scale(140),
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  levelBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: scale(6),
  },
  levelText: {
    color: Colors.white,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statText: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
  },
  dot: {
    width: scale(3),
    height: scale(3),
    borderRadius: scale(1.5),
    backgroundColor: Colors.gray500,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  continueText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
};

export default SavedCard;
