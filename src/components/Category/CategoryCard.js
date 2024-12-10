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

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Detail', { data })} activeOpacity={0.7}>
      <LinearGradient
        colors={['#1F1F1F', '#121212']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.Image source={{ uri: data?.imageURL }} style={styles.image} />

        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {data?.title}
          </Text>

          <Text style={styles.description} numberOfLines={3}>
            {data?.description}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Icon name="time" size={scale(16)} color={Colors.white} />
              <Text style={styles.statText}>{data?.readTime}m</Text>
            </View>
            <View style={styles.stat}>
              <Icon name="heart" size={scale(16)} color={Colors.red} />
              <Text style={styles.statText}>{data?.likes}</Text>
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
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: verticalScale(8),
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
});

export default CategoryCard;
