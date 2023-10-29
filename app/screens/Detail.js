import React, { useState, useEffect, useLayoutEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLikes, unlikeTale, updateLikes } from '../utils/sanity-utils';
import { useBookmark } from '../store/BookmarkContext';
import Icon from '../components/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookmarkButton from '../Detail/BookmarkButton';
import { Colors } from '../constants/colors';
import FormatReadTime from '../components/FormatReadTime';

const Detail = ({ route }) => {
  const { data } = route.params;
  const { bookmarks, toggleBookmark } = useBookmark();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  const readTime = FormatReadTime(data?.tales[0]?.readTime);

  const isBookmarked = bookmarks.find(
    (bookmark) => bookmark.tales[0].slug.current === data.tales[0].slug.current
  );

  const handleBookmark = () => {
    toggleBookmark(data);
  };

  const handleReadButton = async () => {
    navigation.navigate('Content', { slug: data.tales[0].slug.current });

    try {
      await AsyncStorage.setItem('lastRead', JSON.stringify(data));
    } catch (error) {
      console.log('Error saving last read tale:', error);
    }
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
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={handleUnlike}
              disabled={isLoading}
            >
              <Icon name="heart" size={24} color="red" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={{ marginRight: 15 }}
              onPress={handleLike}
              disabled={isLiked || isLoading}
            >
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
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{data?.tales[0]?.title}</Text>
        <Text style={styles.author}>{data?.tales[0]?.author}</Text>
      </View>
      <View style={styles.imageContainer}>
        <Image style={styles.image} source={{ uri: data.imageURL }} />
        <View style={styles.infoContainer}>
          <View style={styles.likesContainer}>
            <Text style={styles.likes}>{data?.tales[0]?.likes}</Text>
            <Text>Likes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.readTimeContainer}>
            <Text style={styles.readTime}>{readTime}</Text>
            <Text>Read Time</Text>
          </View>
        </View>
      </View>
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.description}>{data?.description}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReadButton} style={styles.button}>
          <Text style={styles.readText}>Continue Reading</Text>
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
  titleContainer: {
    marginHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.white,
  },
  author: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
    color: Colors.gray,
  },
  imageContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 16,
    shadowColor: Colors.white,
    elevation: 5,
  },
  image: {
    width: 169,
    height: 237,
    flexShrink: 0,
    borderRadius: 10,
  },
  infoContainer: {
    backgroundColor: Colors.white,
    width: 343,
    height: 62,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: Colors.white,
    elevation: 5,
  },
  likesContainer: {
    alignItems: 'center',
  },
  likes: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.black,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.gray,
  },
  readTimeContainer: {
    alignItems: 'center',
  },
  readTime: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.black,
  },
  descriptionContainer: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  description: {
    fontSize: 16,
    color: Colors.white,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  readText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
});
