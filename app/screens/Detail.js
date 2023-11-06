import React, { useState, useEffect, useLayoutEffect, forwardRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLikes, unlikeTale, updateLikes } from '../utils/sanity-utils';
import { useBookmark } from '../store/BookmarkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BookmarkButton from '../Detail/BookmarkButton';
import { Colors } from '../constants/colors';
import FormatReadTime from '../components/FormatReadTime';
import Toast from 'react-native-toast-message';
import LikeButton from '../components/Detail/LikeButton';
import InfoComponent from '../components/Detail/InfoComponent';

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
    Toast.show({
      type: isBookmarked ? 'error' : 'success',
      position: 'top',
      text1: isBookmarked ? 'Bookmark removed!' : 'Bookmark added!',
      topOffset: 90,
    });
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
      Toast.show({
        type: 'success',
        position: 'bottom',
        text1: 'You liked the tale!',
      });

      try {
        await AsyncStorage.setItem(`liked_${data.tales[0]._id}`, 'true');
      } catch (error) {
        Toast.show({
          type: 'error',
          position: 'bottom',
          text1: 'There was an error saving your like.',
        });
        console.error(`Error saving like status for tale ${data.tales[0]._id}: ${error.message}`);
      }
    }
  };

  const handleUnlike = async () => {
    setIsLiked(false);
    setLikes(likes - 1);
    setHasLiked(false);

    await unlikeTale(data.tales[0]._id, likes - 1);
    Toast.show({
      type: 'info',
      position: 'bottom',
      text1: 'You unliked the tale.',
    });
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
        <View style={styles.headerRightContainer}>
          <LikeButton
            hasLiked={hasLiked}
            isLoading={isLoading}
            handleLike={handleLike}
            handleUnlike={handleUnlike}
          />
          <BookmarkButton isBookmarked={isBookmarked} handleBookmark={handleBookmark} />
        </View>
      ),
    });
  }, [hasLiked, isLoading, handleLike, handleUnlike, isBookmarked, handleBookmark]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{data?.tales[0]?.title}</Text>
        <Text style={styles.author}>{data?.tales[0]?.author}</Text>
      </View>

      {/* Image and Info */}
      <View style={styles.imageInfoContainer}>
        <Image style={styles.image} source={{ uri: data.imageURL }} />
        <InfoComponent readTime={readTime} likes={likes} />
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.descriptionTitle}>Description</Text>
        <Text style={styles.description}>{data?.description}</Text>
      </View>

      {/* Continue Reading Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleReadButton} style={styles.readButton}>
          <Text style={styles.readText}>Continue Reading</Text>
        </TouchableOpacity>
      </View>

      {/* Toast Component */}
      <Toast />
    </View>
  );
};

export default Detail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    backgroundColor: Colors.modalBackground,
  },
  titleContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28, // Adjusted for a more balanced typography
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center', // Center if you want to align the text in the middle
  },
  author: {
    fontSize: 18, // Slightly smaller for visual hierarchy
    fontWeight: 'normal', // Adjusted to 'normal' for a lighter touch
    color: Colors.gray,
    textAlign: 'center', // Center if the title is also centered
  },
  imageInfoContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  image: {
    width: 200, // Slightly larger for better visibility
    height: 300,
    resizeMode: 'cover', // Ensure the image fits nicely within the bounds
    borderRadius: 10,
    marginBottom: 10,
  },
  descriptionContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingBottom: 20, // Padding bottom to ensure content doesn't touch the button
  },
  descriptionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8, // Reduced margin for a tighter title and content
  },
  description: {
    fontSize: 16,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  buttonContainer: {
    justifyContent: 'flex-end',
    padding: 20, // Padding for safe area spacing, especially for devices with rounded corners
  },
  readButton: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 20,
    shadowColor: Colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  readText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
