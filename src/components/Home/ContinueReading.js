import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  withSpring,
} from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';

const HEADER_HEIGHT = hp(40);
const SCROLL_DISTANCE = 200;

const ParallaxHeader = ({ imageUrl, onPress, title, description }) => {
  const scrollY = useSharedValue(0);
  const pressed = useSharedValue(1);

  const imageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-SCROLL_DISTANCE, 0, SCROLL_DISTANCE],
      [-50, 0, 50]
    );
    const scale = interpolate(scrollY.value, [-SCROLL_DISTANCE, 0, SCROLL_DISTANCE], [1.4, 1, 0.8]);

    return {
      transform: [{ translateY }, { scale: scale * pressed.value }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-SCROLL_DISTANCE, 0, SCROLL_DISTANCE],
      [20, 0, -20]
    );
    const opacity = interpolate(
      scrollY.value,
      [-SCROLL_DISTANCE, 0, SCROLL_DISTANCE],
      [0.4, 1, 1.2]
    );

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() => {
        pressed.value = withSpring(0.95);
      }}
      onPressOut={() => {
        pressed.value = withSpring(1);
      }}
    >
      <View style={styles.headerContainer}>
        <Animated.Image source={{ uri: imageUrl }} style={[styles.headerImage, imageStyle]} />
        <Animated.View style={[styles.headerOverlay, overlayStyle]}>
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.gradient}>
            <View style={styles.cardContent}>
              <View style={styles.badge}>
                <Icon name="book-outline" size={16} color={Colors.primary} />
                <Text style={styles.badgeText}>Continue Reading</Text>
              </View>

              <Text style={styles.overlayTitle} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.overlayDescription} numberOfLines={3}>
                {description}
              </Text>

              <View style={styles.readButton}>
                <Text style={styles.readButtonText}>Resume Reading</Text>
                <Icon name="arrow-forward" size={16} color={Colors.primary} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const ContinueReading = ({ lastRead, navigation }) => {
  if (!lastRead) {
    return (
      <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
        <LinearGradient colors={['#2A2D3A', '#1F222E']} style={styles.emptyContent}>
          <Icon name="book-outline" size={48} color={Colors.primary} />
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptySubtitle}>Pick a tale to begin your reading adventure</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <ParallaxHeader
        imageUrl={lastRead.imageURL}
        title={lastRead.title}
        description={lastRead.description}
        onPress={() => navigation.navigate('Detail', { data: lastRead })}
      />

      {lastRead.related && lastRead.related.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={styles.sectionTitle}>Similar Tales</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScroll}
          >
            {lastRead.related.map((item, index) => (
              <Animated.View key={item._id} entering={FadeInDown.delay(index * 100)}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Detail', { data: item })}
                  activeOpacity={0.8}
                  style={styles.relatedCard}
                >
                  <Image source={{ uri: item.imageURL }} style={styles.relatedImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.9)']}
                    style={styles.relatedGradient}
                  >
                    <Text style={styles.relatedTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    borderRadius: scale(20),
    marginHorizontal: spacing.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    height: '100%',
  },
  cardContent: {
    gap: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(133, 84, 247, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: scale(20),
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: Colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  overlayTitle: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  overlayDescription: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    lineHeight: fontSizes.lg,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  readButtonText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  emptyContainer: {
    margin: spacing.md,
  },
  emptyContent: {
    padding: spacing.xl,
    borderRadius: scale(20),
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: Colors.gray400,
    textAlign: 'center',
  },
  relatedSection: {
    marginTop: spacing.md,
    paddingLeft: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  relatedScroll: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  relatedCard: {
    width: wp(40),
    height: hp(25),
    borderRadius: scale(16),
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  relatedGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  relatedTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ContinueReading;
