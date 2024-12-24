import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { wp, hp, moderateScale, spacing, fontSizes } from '../../utils/dimensions';

const Categories = ({ data, index }) => {
  const navigation = useNavigation();

  return (
    <Animated.View entering={FadeInDown.springify().delay(index * 100)} style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CategoryList', { category: data?.title })}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[data?.color + '30' || Colors.dark800, Colors.dark900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.iconWrapper}>
            <View style={[styles.iconBackground, { backgroundColor: data?.color + '15' }]}>
              <Icon
                name={data?.iconName || 'book'}
                size={22}
                color={data?.color || Colors.primary}
              />
            </View>
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {data?.title}
              </Text>
              {data?.talesCount > 0 && (
                <Text style={[styles.count, { color: data?.color }]}>{data.talesCount} Tales</Text>
              )}
            </View>

            <View style={styles.arrow}>
              <Icon name="arrow-forward" size={16} color={data?.color || Colors.primary} />
            </View>
          </View>

          <View style={[styles.accent, { backgroundColor: data?.color + '40' }]} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: wp(42),
    marginHorizontal: spacing.md,
  },
  card: {
    borderRadius: moderateScale(14),
    height: wp(38),
    padding: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.dark700 + '30',
  },
  iconWrapper: {
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    gap: 4,
  },
  title: {
    fontSize: fontSizes.md,
    color: Colors.white,
    fontWeight: '600',
  },
  count: {
    fontSize: fontSizes.xs,
    fontWeight: '500',
  },
  arrow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  accent: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
});

export default Categories;
