import React, { useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import Toast from 'react-native-toast-message';

const SavedCard = ({ data, onDelete }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleDelete = async (data) => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 500,
      useNativeDriver: true,
    }).start(async () => {
      onDelete(data);
      Toast.show({
        type: 'error',
        text1: 'Bookmark removed from saved!',
        topOffset: 90,
      });
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
      <TouchableOpacity onPress={() => handleDelete(data)} style={styles.deleteButton}>
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
