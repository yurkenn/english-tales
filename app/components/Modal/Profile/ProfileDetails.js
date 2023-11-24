import React, { useContext, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { AuthContext } from '../../../store/AuthContext';
import { Colors } from '../../../constants/colors';
import * as ImagePicker from 'expo-image-picker';

const ProfileDetails = () => {
  const { userInfo, updateUserInfo } = useContext(AuthContext);
  const DEFAULT_IMAGE_PATH = '../../../../assets/images/blank-profile.png';

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Changed to 1:1 aspect ratio for square images
        quality: 1,
      });

      if (!result.canceled) {
        const updatedUserInfo = { ...userInfo, photoURL: result.assets[0].uri };
        updateUserInfo(updatedUserInfo);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          style={styles.profileImage}
          source={userInfo.photoURL ? { uri: userInfo.photoURL } : require(DEFAULT_IMAGE_PATH)}
          accessibilityLabel="User's profile image"
        />
      </TouchableOpacity>
      <Text style={styles.displayName}>
        {userInfo.displayName ||
          (userInfo.firstName && userInfo.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : 'User')}
      </Text>
      <Text style={styles.email}>{userInfo.email}</Text>
    </View>
  );
};

export default ProfileDetails;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    textAlign: 'center',
    alignItems: 'center',
  },
  displayName: {
    fontSize: width < 400 ? 22 : 24, // Smaller font size for smaller screens
    letterSpacing: 1,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileImage: {
    width: width * 0.25, // 25% of screen width
    height: width * 0.25, // Maintain aspect ratio
    borderRadius: width * 0.125, // Half of width and height for a perfect circle
    marginVertical: 10,
  },
  email: {
    marginTop: 10,
    fontSize: width < 400 ? 12 : 14, // Smaller font size for smaller screens
    color: Colors.white,
  },
});
