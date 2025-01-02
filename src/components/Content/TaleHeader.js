// src/components/Content/TaleHeader.js
import React from 'react';
import { StyleSheet, Image, View, Text } from 'react-native';
import { urlFor } from '../../../sanity';
import { hp, wp, fontSizes } from '../../utils/dimensions';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';

const getDifficultyColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return Colors.success;
    case 'intermediate':
      return Colors.warning;
    case 'advanced':
      return Colors.error;
    default:
      return Colors.gray400;
  }
};

const TaleHeader = ({ imageURL, difficulty }) => {
  const difficultyColor = getDifficultyColor(difficulty);
  
  return (
    <View style={styles.container}>
      <Image source={{ uri: urlFor(imageURL).url() }} style={styles.headerImage} />
      {difficulty && (
        <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
          <Icon name="star" size={16} color={difficultyColor} />
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>
            {difficulty}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: hp(45),
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: hp(2),
    right: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: 20,
    gap: wp(1),
  },
  difficultyText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default TaleHeader;
