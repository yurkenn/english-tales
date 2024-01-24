import { Dimensions, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';

const InfoComponent = ({ readTime, likes }) => (
  <View style={styles.infoContainer}>
    <View style={styles.likesContainer}>
      <Text style={styles.likes}>{likes}</Text>
      <Text style={styles.infoTextColor}>Likes</Text>
    </View>
    <View style={styles.divider} />
    <View style={styles.readTimeContainer}>
      <Text style={styles.readTime}>{readTime}</Text>
      <Text style={styles.infoTextColor}>Read Time</Text>
    </View>
  </View>
);

export default InfoComponent;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Responsive font sizes based on screen width
const fontSizeLikesReadTime = windowWidth * 0.045;
const fontSizeInfoText = windowWidth * 0.035;

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: windowHeight * 0.02,
    paddingVertical: windowHeight * 0.015,
    width: windowWidth * 0.9,
    alignSelf: 'center',
    borderRadius: 10,
    backgroundColor: Colors.dark500,
    shadowColor: Colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  likesContainer: {
    alignItems: 'center',
  },
  likes: {
    fontSize: fontSizeLikesReadTime,
    fontWeight: 'bold',
    color: Colors.white,
  },
  infoTextColor: {
    fontSize: fontSizeInfoText,
    color: Colors.gray,
  },
  divider: {
    width: windowWidth * 0.002,
    height: windowHeight * 0.04,
    alignSelf: 'center',
    backgroundColor: Colors.gray,
  },
  readTimeContainer: {
    alignItems: 'center',
  },
  readTime: {
    fontSize: fontSizeLikesReadTime,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
