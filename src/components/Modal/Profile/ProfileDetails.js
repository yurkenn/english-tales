import React, { useContext } from 'react';
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

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: windowHeight * 0.05,
  },
  displayName: {
    fontSize: windowWidth * 0.05,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileImage: {
    width: windowWidth * 0.25,
    height: windowWidth * 0.25,
    borderRadius: windowWidth * 0.25,
    marginVertical: windowHeight * 0.02,
  },
  email: {
    marginTop: windowHeight * 0.01,
    fontSize: windowWidth * 0.04,
    color: Colors.white,
  },
});
