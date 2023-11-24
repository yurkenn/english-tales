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

const { width } = Dimensions.get('window');

// Responsive font sizes based on screen width
const fontSizeLikesReadTime = width < 400 ? 16 : 18;
const fontSizeInfoText = width < 400 ? 14 : 16;

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
    width: '90%',
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
    width: 1,
    height: 24,
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
