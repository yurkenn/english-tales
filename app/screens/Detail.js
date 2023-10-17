import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Colors } from '../constants/colors';
import { Rating } from 'react-native-ratings';
import Icon from '../components/Icons';
import { useBookmark } from '../store/BookmarkContext';

const Detail = ({ route, navigation }) => {
  const { data } = route.params;
  const [rating, setRating] = useState(0);
  console.log('DETAIL', data);

  const { bookmarks, toggleBookmark } = useBookmark();

  const bookmarked = bookmarks.includes(data);

  const handleBookmark = () => {
    toggleBookmark(data);
  };

  const handleReadButton = () => {
    navigation.navigate('Content', { slug: data.tales[0].slug.current });
  };

  const handleRating = (rating) => {
    setRating(rating);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleBookmark}>
          <Icon
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={bookmarked ? Colors.white : Colors.white}
          />
        </TouchableOpacity>
      ),
    });
  });

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: data.imageURL }} style={styles.image} />
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.author}>{data.tales[0].author}</Text>
      </View>
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.description}>{data.description}</Text>
      </View>
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingTitle}>Rate this book:</Text>
        <Rating
          type="star"
          ratingCount={5}
          imageSize={30}
          startingValue={rating}
          onFinishRating={handleRating}
          style={{ paddingVertical: 10 }}
          ratingBackgroundColor={Colors.dark900}
          tintColor={Colors.dark900}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReadButton} style={styles.button}>
          <Text style={styles.buttonText}>Read</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Detail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 100,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 250,
    borderRadius: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: Colors.white,
  },
  author: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray,
    marginTop: 10,
  },
  descriptionContainer: {
    padding: 10,
    marginTop: 10,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  description: {
    fontSize: 18,
    marginTop: 5,
    letterSpacing: 0.5,
    color: Colors.white,
  },
  ratingContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: Colors.dark900,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },

  buttonContainer: {
    flex: 1,
    marginTop: 40,
  },
  button: {
    backgroundColor: Colors.dark500,
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
});
