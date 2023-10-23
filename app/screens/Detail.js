import React, { useState, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLikes, unlikeTale, updateLikes } from '../utils/sanity-utils';
import { useBookmark } from '../store/BookmarkContext';
import Icon from '../components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookmarkButton from '../Detail/BookmarkButton';

const Detail = ({ route }) => {
  const { data } = route.params;
  const { bookmarks, toggleBookmark } = useBookmark();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark.tales[0].slug.current === data.tales[0].slug.current
  );

  const handleBookmark = () => {
    toggleBookmark(data);
  };

  const handleReadButton = () => {
    navigation.navigate('Content', { slug: data.tales[0].slug.current });
  };

  const handleLike = async () => {
    if (!hasLiked) {
      setIsLiked(true);
      setLikes(likes + 1);
      setHasLiked(true);

      await updateLikes(data.tales[0]._id, likes + 1);

      try {
        await AsyncStorage.setItem(`liked_${data.tales[0]._id}`, 'true');
      } catch (error) {
        console.error(`Error saving like status for tale ${data.tales[0]._id}: ${error.message}`);
      }
    }
  };

  const handleUnlike = async () => {
    setIsLiked(false);
    setLikes(likes - 1);
    setHasLiked(false);

    await unlikeTale(data.tales[0]._id, likes - 1);
  };

  useEffect(() => {
    const fetchLikesForTale = async () => {
      const taleId = data.tales[0]._id;
      const likes = await fetchLikes(taleId);
      setLikes(likes);

      try {
        const likeStatus = await AsyncStorage.getItem(`liked_${taleId}`);
        if (likeStatus === 'true') {
          setHasLiked(true);
        }
      } catch (error) {
        console.error(`Error fetching like status for tale ${taleId}: ${error.message}`);
      }

      setIsLoading(false);
    };
    fetchLikesForTale();
  }, [data]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {hasLiked ? (
            <TouchableOpacity onPress={handleUnlike} disabled={isLoading}>
              <Icon name="heart" size={24} color="red" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleLike} disabled={isLiked || isLoading}>
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? 'red' : 'white'}
              />
            </TouchableOpacity>
          )}
          <BookmarkButton isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
        </View>
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
    color: 'white',
  },
  author: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  descriptionContainer: {
    padding: 10,
    marginTop: 10,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  description: {
    fontSize: 18,
    marginTop: 5,
    letterSpacing: 0.5,
    color: 'white',
  },
  buttonContainer: {
    flex: 1,
    marginTop: 40,
  },
  button: {
    backgroundColor: '#333',
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
