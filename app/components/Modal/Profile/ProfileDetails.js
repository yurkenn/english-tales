import React, { useContext, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Colors } from '../../../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../../store/AuthContext';

const ProfileDetails = ({ userData }) => {
  const [image, setImage] = useState(userData?.photoURL);
  const { updateUserProfileImage } = useContext(AuthContext);

  // Destructuring for cleaner code
  const { displayName, firstName, lastName, email, photoURL } = userData || {};
  const fullName = displayName || `${firstName} ${lastName}`;

  // Function to handle the selection of an image
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newImageUri = result.assets[0].uri;
        setImage(newImageUri);

        // Update the user data with the new image URI
        updateUserProfileImage(newImageUri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick an image.');
      console.error(error);
    }
  };

  // Load the image from AsyncStorage when the component mounts or updates
  useEffect(() => {
    const loadProfileImage = async () => {
      const userJson = await AsyncStorage.getItem('@user');
      const user = userJson != null ? JSON.parse(userJson) : {};
      setImage(user.photoURL || '../../../assets/images/blank-profile.png');
    };

    loadProfileImage();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image
          style={styles.profileImage}
          source={{ uri: image || '../../../assets/images/blank-profile.png' }}
          accessibilityLabel="User's profile image"
        />
      </TouchableOpacity>
      <Text style={styles.displayName}>{fullName}</Text>
      <Text style={styles.email}>{email}</Text>
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
