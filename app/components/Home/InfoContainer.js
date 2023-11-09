import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';

const InfoContainer = ({ readTime, likes }) => (
  <View style={styles.infoContainer}>
    <View style={styles.readTimeContainer}>
      <Icon name={'time-outline'} size={16} color={'white'} />
      <Text style={styles.readTime}>{readTime}</Text>
    </View>
    <View style={styles.bookmarkContainer}>
      <Icon name={'heart'} size={16} color={'red'} />
      <Text style={styles.bookmarks}>{likes}</Text>
    </View>
  </View>
);

export default InfoContainer;

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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
