import { View, Text } from 'react-native';
import React from 'react';

const DetailHeader = ({
  hasLiked,
  isLoading,
  handleLike,
  handleUnlike,
  isBookmarked,
  handleBookmark,
  handleOpenModal,
}) => (
  <View style={styles.container}>
    <LikeButton {...{ hasLiked, isLoading, handleLike, handleUnlike }} />
    <BookmarkButton {...{ isBookmarked, handleBookmark }} />
    <SettingsButton handleOpenModal={handleOpenModal} />
  </View>
);

export default DetailHeader;
