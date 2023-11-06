import { StyleSheet, Text, View } from 'react-native';
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

const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10, // Padding for a taller info container
    width: '90%', // Use percentage for responsive width
    alignSelf: 'center', // Center the info container
    borderRadius: 10, // Match the borderRadius with image for consistency
    backgroundColor: Colors.dark500, // Use a dark theme for info container
    shadowColor: Colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  likesContainer: {
    alignItems: 'center',
  },
  likes: {
    fontSize: 18, // Adjusted for balance
    fontWeight: 'bold', // Bold for emphasis on the number of likes
    color: Colors.white, // Use a light color for contrast against the dark background
  },
  infoTextColor: {
    fontSize: 16, // Adjusted for balance
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
    fontSize: 18, // Adjusted for balance
    fontWeight: 'bold', // Bold for emphasis on the read time
    color: Colors.white, // Use a light color for contrast against the dark background
  },
});
