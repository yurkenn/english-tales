// src/components/Detail/HeaderButtons.js
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import LikeButton from './LikeButton';
import BookmarkButton from './BookmarkButton';
import SettingsButton from './SettingsButton';
import Icon from '../Icons';
import Animated, { useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { wp, hp, scale, spacing } from '../../utils/dimensions';
import { useNavigation } from '@react-navigation/native';

const HeaderButtons = ({
  scrollY,
  hasLiked,
  isLoading,
  handleLike,
  isBookmarked,
  handleBookmark,
  handleOpenModal,
}) => {
  const navigation = useNavigation();

  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [0, 1]);

    return {
      backgroundColor: `rgba(22, 22, 22, ${opacity})`,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={scale(24)} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.rightButtons}>
          <LikeButton hasLiked={hasLiked} isLoading={isLoading} handleLike={handleLike} />
          <BookmarkButton isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
          <SettingsButton handleOpenModal={handleOpenModal} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: hp(6),
    paddingBottom: hp(2),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
  },
  backButton: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    backgroundColor: Colors.dark800,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale(3.84),
    elevation: 5,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
});

export default HeaderButtons;
