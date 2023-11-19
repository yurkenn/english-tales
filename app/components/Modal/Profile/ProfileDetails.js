import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../../store/AuthContext';
import { Colors } from '../../../constants/colors';

const ProfileDetails = () => {
  const { userInfo } = useContext(AuthContext);

  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <Image
          style={styles.profileImage}
          source={{ uri: userInfo.photoURL }}
          accessibilityLabel="User's profile image"
        />
      </TouchableOpacity>
      <Text style={styles.displayName}>
        {userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`}
      </Text>
      <Text style={styles.email}>{userInfo.email}</Text>
    </View>
  );
};

export default ProfileDetails;

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    textAlign: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    letterSpacing: 1,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 50,
    marginVertical: 10,
  },
  email: {
    marginTop: 10,
    fontSize: 14,
    color: Colors.white,
  },
});
