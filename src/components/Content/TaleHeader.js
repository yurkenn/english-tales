// src/components/Content/TaleHeader.js
import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { urlFor } from '../../../sanity';
import { hp } from '../../utils/dimensions';

const TaleHeader = ({ imageURL }) => {
  return <Image source={{ uri: urlFor(imageURL).url() }} style={styles.headerImage} />;
};

const styles = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: hp(45),
    resizeMode: 'cover',
    opacity: 0.8,
  },
});

export default TaleHeader;
