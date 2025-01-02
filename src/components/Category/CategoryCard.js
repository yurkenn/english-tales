import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import Icon from '../Icons';
import { scale, spacing, fontSizes } from '../../utils/dimensions';

const CategoryCard = ({ data, index }) => {
  const navigation = useNavigation();
  const formattedDuration = `${data?.estimatedDuration}m`;
  const cardColor = data?.category?.color || Colors.primary;
  const pressed = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(pressed.value ? 0.98 : 1) }],
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.cardWrapper}>
      <Animated.View style={cardStyle}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Detail', { data })}
          onPressIn={() => (pressed.value = 1)}
          onPressOut={() => (pressed.value = 0)}
          activeOpacity={0.95}
        >
          <View style={styles.container}>
            {/* Görsel Kısmı */}
            <View style={styles.imageSection}>
              <Animated.Image source={{ uri: data?.imageURL }} style={styles.image} />
              <LinearGradient
                colors={['transparent', Colors.dark900]}
                locations={[0.3, 1]}
                style={styles.imageOverlay}
              />
              <View style={[styles.levelBadge, { backgroundColor: cardColor + '15' }]}>
                <Text style={[styles.levelText, { color: cardColor }]}>{data?.level}</Text>
              </View>
              {/* Author */}
              <View style={styles.author}>
                <Image source={{ uri: data?.author?.image }} style={styles.authorImage} />
                <Text style={styles.authorText}>{data?.author?.name}</Text>
              </View>
            </View>

            {/* İçerik Kısmı */}
            <View style={styles.contentSection}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {data?.title}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {data?.description}
                </Text>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Icon name="time" size={16} color={Colors.gray300} />
                  <Text style={styles.statText}>{formattedDuration}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Icon name="star" size={16} color={Colors.warning} />
                  <Text style={styles.statText}>{data?.difficulty}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Icon name="heart" size={16} color={Colors.error} />
                  <Text style={styles.statText}>{data?.likes}</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    margin: spacing.sm,
    borderRadius: scale(16),
    shadowColor: Colors.dark900,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  container: {
    backgroundColor: Colors.dark800,
    borderRadius: scale(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark700 + '20',
  },
  imageSection: {
    height: scale(170),
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.dark900,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.9,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    bottom: 0,
    opacity: 0.8,
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
    fontSize: fontSizes.sm,
    fontWeight: '900',
  },
  author: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorImage: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
  },
  authorText: {
    fontSize: fontSizes.sm,
    color: Colors.white,
    fontWeight: '500',
  },
  contentSection: {
    padding: spacing.md,
  },
  titleContainer: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    lineHeight: scale(18),
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark700 + '30',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: spacing.md,
  },
  statDivider: {
    width: 1,
    height: scale(16),
    backgroundColor: Colors.dark700 + '40',
  },
  statText: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
  },
});

export default CategoryCard;
