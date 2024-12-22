import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  fontSizes,
  wp,
  isSmallDevice,
  layout,
} from '../../utils/dimensions';

const Categories = ({ data, index }) => {
  const navigation = useNavigation();
  const buttonSize = isSmallDevice ? wp(22) : wp(25);

  return (
    <Animated.View entering={FadeInDown.springify().delay(index * 100)} style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.navigate('CategoryList', { category: data?.title })}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[data?.color || '#1F1F1F', Colors.dark900]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { width: buttonSize, height: buttonSize }]}
        >
          <Icon name={data?.iconName || 'book'} size={buttonSize * 0.4} color={Colors.white} />
          <Text style={styles.categoryName} numberOfLines={2}>
            {data?.title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.xs,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(12),
    padding: spacing.sm,
    gap: verticalScale(8),
  },
  categoryName: {
    color: Colors.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
    lineHeight: moderateScale(18),
    marginBottom: spacing.xs,
  },
});

export default Categories;
