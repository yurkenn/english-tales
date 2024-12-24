import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';

const SavedCard = ({ data, onDelete, onPress, index = 0 }) => {
  const pressed = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(pressed.value) }],
    };
  });

  const handlePressIn = () => {
    pressed.value = 0.95;
  };

  const handlePressOut = () => {
    pressed.value = 1;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.container}>
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.dark800, Colors.dark900]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Image with Overlay */}
            <View style={styles.imageWrapper}>
              <Image source={{ uri: data?.imageURL }} style={styles.image} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
              {/* Category and Delete */}
              <View style={styles.topRow}>
                <View style={[styles.categoryBadge, { backgroundColor: Colors.primary + '15' }]}>
                  <Icon name="bookmark" size={14} color={Colors.primary} />
                  <Text style={styles.categoryText}>{data?.category?.title || 'Story'}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => onDelete(data)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>

              {/* Title & Description */}
              <View style={styles.textContent}>
                <Text style={styles.title} numberOfLines={1}>
                  {data?.title}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {data?.description}
                </Text>
              </View>

              {/* Stats & Continue Button */}
              <View style={styles.bottomRow}>
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Icon name="time-outline" size={16} color={Colors.gray300} />
                    <Text style={styles.statText}>{data?.estimatedDuration}m</Text>
                  </View>
                  <View style={styles.separator} />
                  <View style={styles.statItem}>
                    <Icon name="heart" size={16} color={Colors.error} />
                    <Text style={styles.statText}>{data?.likes || 0}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.continueButton}>
                  <Text style={styles.continueText}>Continue</Text>
                  <Icon name="arrow-forward" size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    borderRadius: scale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    flexDirection: 'row',
    borderRadius: scale(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark700 + '20',
    padding: spacing.sm,
  },
  imageWrapper: {
    width: wp(22),
    aspectRatio: 0.75,
    borderRadius: scale(12),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: scale(12),
    gap: 4,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  textContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.xs / 2,
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    lineHeight: fontSizes.md * 1.3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.dark700,
    marginHorizontal: spacing.sm,
  },
  statText: {
    fontSize: fontSizes.xs,
    color: Colors.gray300,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  continueText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default SavedCard;
