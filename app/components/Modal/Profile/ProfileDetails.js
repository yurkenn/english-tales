import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../../store/AuthContext';
import { Colors } from '../../../constants/colors';
import * as ImagePicker from 'expo-image-picker';

const ProfileDetails = () => {
  const { userInfo, updateUserInfo } = useContext(AuthContext);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0,
    });

    if (!result.canceled) {
      const updatedUserInfo = { ...userInfo, photoURL: result.assets[0].uri };
      updateUserInfo(updatedUserInfo);
    }
  };

  const profilePicture = userInfo.photoURL
    ? { uri: userInfo.photoURL }
    : require('../../../../assets/images/blank-profile.png');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          style={styles.profileImage}
          source={profilePicture}
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
