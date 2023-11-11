import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileDetails = ({ userData }) => {
  const [image, setImage] = useState(userData?.photoURL);

  // Destructuring for cleaner code
  const { displayName, firstName, lastName, email, photoURL } = userData || {};
  const fullName = displayName || `${firstName} ${lastName}`;

  // Function to handle the selection of an image
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Limit to images only
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.uri);
        // Update the AsyncStorage with the new image URI
        const updatedUserData = { ...userData, photoURL: result.uri };
        await AsyncStorage.setItem('@user', JSON.stringify(updatedUserData));
      }
    } catch (error) {
      // Handle errors here
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
