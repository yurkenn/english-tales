import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { urlFor } from '../../../sanity';
import FormatReadTime from '../FormatReadTime';
import ModalDetail from '../ModalDetail';
import Icon from '../../UI/Icons';
import Animated, {
  Easing,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const FeaturedStories = ({ data }) => {
  const navigation = useNavigation();
  console.log('DESCRIPTION', data);

  const [isModalVisible, setModalVisible] = useState(false);
  const modalOpacity = useSharedValue(0);

  const openModal = () => {
    modalOpacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
    setModalVisible(true);
  };

  const closeModal = () => {
    modalOpacity.value = withTiming(0, { duration: 300, easing: Easing.ease });
    setModalVisible(false);
  };

  const handleDetailButton = () => {
    openModal();
  };

  const handleRead = () => {
    navigation.navigate('Content', { slug: data.tales[0].slug.current });
  };

  const readTime = data.tales[0].readTime;
  const formattedReadTime = FormatReadTime(readTime);

  return (
    <TouchableOpacity onPress={handleRead}>
      <View>
        {data && (
          <View style={styles.container}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: urlFor(data.imageURL).url() }} style={styles.image} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{data.title}</Text>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.readTimeContainer}>
                <Icon name={'time-outline'} size={16} color={'white'} />
                <Text style={styles.readTime}>{formattedReadTime}</Text>
              </View>
              <View style={styles.bookmarkContainer}>
                <Icon name={'star-outline'} size={16} color={'white'} />
                <Text style={styles.bookmarks}>{data.tales[0].likes}</Text>
              </View>
              <View style={styles.detailButtonContainer}>
                <TouchableOpacity onPress={handleDetailButton} style={styles.detailButton}>
                  <Text style={styles.detailButtonText}>Detail</Text>
                </TouchableOpacity>
              </View>
            </View>
            <ModalDetail
              data={data}
              isModalVisible={isModalVisible}
              closeModal={closeModal}
              onBackdropPress={() => setModalVisible(false)}
              onSwipeComplete={() => setModalVisible(false)}
              swipeDirection="down"
              handleRead={handleRead}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedStories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark500,
    borderRadius: 10,
    marginHorizontal: 10,
    padding: 10,
  },

  imageContainer: {
    position: 'relative',
  },
  image: {
    borderRadius: 10,
    height: 150,
    width: 250,
    resizeMode: 'cover',
  },
  authorContainer: {
    backgroundColor: Colors.dark900,
    borderRadius: 6,
    height: 30,
    bottom: 10,
    left: 10,
    padding: 5,
    position: 'absolute',
  },
  author: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    marginVertical: 10,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  category: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  readTime: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  detailButtonContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailButton: {
    backgroundColor: Colors.dark900,
    borderRadius: 6,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
  },
  detailButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  bookmarks: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
