import { Dimensions, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';

const InfoContainer = ({ readTime, likes }) => (
  <View style={styles.infoContainer}>
    <View style={styles.readTimeContainer}>
      <Icon name={'time-outline'} size={iconSize} color={'white'} />
      <Text style={styles.readTime}>{readTime}</Text>
    </View>
    <View style={styles.bookmarkContainer}>
      <Icon name={'heart'} size={iconSize} color={'red'} />
      <Text style={styles.bookmarks}>{likes}</Text>
    </View>
  </View>
);

export default InfoContainer;

const { width } = Dimensions.get('window');

const fontSize = width < 400 ? 10 : 12; // Smaller font size for smaller screens
const iconSize = width < 400 ? 14 : 16; // Smaller icon size for smaller screens

const styles = StyleSheet.create({
  infoContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  readTime: {
    color: Colors.white,
    fontSize: fontSize,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  bookmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  bookmarks: {
    color: Colors.white,
    fontSize: fontSize,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
