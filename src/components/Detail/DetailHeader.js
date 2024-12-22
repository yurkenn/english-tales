import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import LikeButton from './LikeButton';
import BookmarkButton from './BookmarkButton';
import SettingsButton from './SettingsButton';
import { spacing } from '../../utils/dimensions';

const DetailHeader = ({
  hasLiked,
  isLoading,
  handleLike,
  isBookmarked,
  handleBookmark,
  handleOpenModal,
}) => {
  return (
    <View style={styles.container}>
      <LikeButton hasLiked={hasLiked} isLoading={isLoading} handleLike={handleLike} />
      <BookmarkButton isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
      <SettingsButton handleOpenModal={handleOpenModal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.xs,
  },
});

export default DetailHeader;
