import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';

const ProfileDetails = ({ userData }) => (
  <View style={styles.profileContainer}>
    <Image
      style={styles.profileImage}
      source={{
        uri: userData?.photoURL || '../../assets/images/blank-profile.png',
      }}
    />
    <Text style={styles.displayName}>
      {userData?.displayName || `${userData?.firstName} ${userData?.lastName}`}
    </Text>
    <Text style={styles.email}>{userData?.email}</Text>
  </View>
);

export default ProfileDetails;

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.dark500,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
  },
  email: {
    fontSize: 16,
    color: Colors.gray,
  },
});
