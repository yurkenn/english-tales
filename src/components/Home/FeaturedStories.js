import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { urlFor } from '../../../sanity';
import FormatReadTime from '../FormatReadTime';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { wp, hp, moderateScale, spacing, fontSizes } from '../../utils/dimensions';

const FeaturedStories = ({ data, navigation, index }) => {
  const formattedReadTime = `${data?.tales?.[0]?.estimatedDuration}m`;

  return (
    <Animated.View entering={FadeInRight.delay(index * 200).springify()} style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Detail', { data: data.tales[0] })}
        activeOpacity={0.8}
      >
        <View style={styles.card}>
          {/* Görsel Alanı */}
          <Image source={{ uri: urlFor(data?.imageURL).url() }} style={styles.image} />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.contentGradient}
          >
            {/* İstatistik Rozetleri */}
            <View style={styles.statBadges}>
              <View style={styles.badge}>
                <Icon name="time" size={14} color={Colors.primary} />
                <Text style={styles.badgeText}>{formattedReadTime}</Text>
              </View>

              <View style={styles.badge}>
                <Icon name="heart" size={14} color={Colors.error} />
                <Text style={styles.badgeText}>{data?.tales?.[0]?.likes || 0}</Text>
              </View>
            </View>

            {/* İçerik Alanı */}
            <View style={styles.contentContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {data?.title}
                </Text>
                <View style={styles.topBadges}>
                  {data?.tales?.[0]?.level && (
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{data?.tales?.[0]?.level}</Text>
                    </View>
                  )}
                  {data?.tales?.[0]?.category && (
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                      style={styles.categoryBadge}
                    >
                      <Text style={styles.categoryText}>{data?.tales?.[0]?.category?.title}</Text>
                    </LinearGradient>
                  )}
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {data?.tales?.[0]?.description}
              </Text>

              <View style={styles.readMore}>
                <Text style={styles.readMoreText}>Read Now</Text>
                <Icon name="arrow-forward" size={16} color={Colors.primary} />
              </View>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginLeft: spacing.md,
    marginRight: spacing.xs,
    width: wp(75),
    height: hp(45),
  },
  card: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: Colors.dark800,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  statBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark900 + '90',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: moderateScale(20),
    gap: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  contentContainer: {
    gap: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  topBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'flex-end',
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: moderateScale(6),
    backgroundColor: Colors.primary + '90',
  },
  levelText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  categoryText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  description: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    lineHeight: fontSizes.sm * 1.4,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  readMoreText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default FeaturedStories;
