import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import { AnimatedScrollView } from '@kanelloc/react-native-animated-header-scroll-view';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import TopNavbar from '../components/Content/TopNavbar';
import { Colors } from '../constants/colors';
import useGetTale from '../hooks/useGetTale';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';

const Content = ({ route }) => {
  const { slug } = route.params;
  console.log('DATA: ', slug);

  const { loading, error, tale } = useGetTale(slug);
  console.log('TALE: ', tale);

  // State for tracking like and bookmark status
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Function to handle liking
  const handleLike = () => {
    // Toggle like status
    setIsLiked(!isLiked);

    // Implement logic to send like to your server or store it locally
  };

  // Function to handle bookmarking
  const handleBookmark = () => {
    // Toggle bookmark status
    setIsBookmarked(!isBookmarked);

    // Implement logic to save the story to bookmarks
  };

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;

  return (
    <View style={styles.container}>
      {tale && (
        <AnimatedScrollView
          headerImage={{ uri: urlFor(tale[0].imageURL).url() }}
          HeaderNavbarComponent={<HeaderNavbar title={tale[0].title} />}
          TopNavBarComponent={<TopNavbar title={tale[0].title} />}
          imageStyle={styles.headerImage}
          disableScale={true}
        >
          <View style={styles.content}>
            <TaleContent style={styles.blocks} blocks={tale[0].content} />
          </View>

          {/* Like and Bookmark Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleLike}>
              {/* <Image
                source={
                  isLiked ? require('../../assets/liked.png') : require('../../assets/like.png')
                }
                style={styles.likeButton}
              /> */}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBookmark}>
              {/* <Image
                source={
                  isBookmarked
                    ? require('../../assets/bookmarked.png')
                    : require('../../assets/bookmark.png')
                }
                style={styles.bookmarkButton}
              /> */}
            </TouchableOpacity>
          </View>
        </AnimatedScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  headerImage: {
    height: 300,
    width: '100%',
    opacity: 0.8,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  likeButton: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  bookmarkButton: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});

export default Content;
