import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
        text1: 'Bookmark removed from library!',
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
      </View>
      <TouchableOpacity onPress={() => handleDelete(data)} style={styles.deleteButton}>
        <Icon name="trash" size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default SavedCard;

const { width } = Dimensions.get('window');

const imageSize = width < 400 ? { width: 40, height: 60 } : { width: 50, height: 70 };
const titleFontSize = width < 400 ? 14 : 16;
const authorFontSize = width < 400 ? 12 : 14;

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
    ...imageSize,
    borderRadius: 5,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: titleFontSize,
    fontWeight: 'bold',
    color: Colors.white,
  },
  author: {
    fontSize: authorFontSize,
    color: Colors.gray,
  },
  deleteButton: {
    marginLeft: 10,
  },
});
