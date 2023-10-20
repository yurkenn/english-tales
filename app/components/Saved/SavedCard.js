import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../Icons';
import { useBookmark } from '../../store/BookmarkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';

const SavedCard = ({ data, onDelete }) => {
  const { setBookmarks, bookmarks } = useBookmark();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleDelete = async () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 500,
      useNativeDriver: true,
    }).start(async () => {
      const index = bookmarks.findIndex((b) => b === data);
      if (index !== -1) {
        const newBookmarks = [...bookmarks];
        newBookmarks.splice(index, 1);
        setBookmarks(newBookmarks);
        try {
          await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
        } catch (error) {
          console.error('Error saving bookmarks:', error);
        }
      }
    });
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: data.imageURL }} style={styles.image} />
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.author}>{data.tales[0].author}</Text>
      </View>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Icon name="trash" size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SavedCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: Colors.dark500,
    borderRadius: 5,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 10,
  },
  image: {
    width: 50,
    height: 70,
    borderRadius: 5,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  author: {
    fontSize: 14,
    color: Colors.gray,
  },
  deleteButton: {
    marginLeft: 10,
  },
});
