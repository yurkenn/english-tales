import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const ContinueReading = () => {
  const navigation = useNavigation();
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    const getLastRead = async () => {
      try {
        const value = await AsyncStorage.getItem('lastRead');
        if (value !== null) {
          setLastRead(JSON.parse(value));
        }
      } catch (error) {
        console.log('Error retrieving last read tale:', error);
      }
    };

    getLastRead();
  }, [navigation]);

  const handleGoTaleDetail = () => {
    navigation.navigate('Detail', { data: lastRead });
  };

  return (
    <TouchableOpacity onPress={handleGoTaleDetail}>
      {lastRead ? (
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: lastRead.imageURL }} style={styles.image} />
          </View>
          <View style={styles.infoContainer}>
            <View>
              <Text style={styles.title}>{lastRead.title}</Text>
              <Text style={styles.author}>{lastRead.tales[0].author}</Text>
            </View>
            <View>
              <Text style={styles.lastRead}>{lastRead.lastRead}</Text>
            </View>
          </View>
        </View>
      ) : (
        <Text>No last read tale found</Text>
      )}
    </TouchableOpacity>
  );
};

export default ContinueReading;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    marginBottom: 10,
    marginTop: 10,
    padding: 10,
  },

  imageContainer: {
    flex: 1.5,
  },
  image: {
    height: 136,
    width: 128,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 2,
    justifyContent: 'space-between',
    marginLeft: 25,
  },
  title: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  author: {
    marginTop: 8,
    color: Colors.white,
    fontSize: 14,
    lineHeight: 16,
  },
  lastRead: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
});
