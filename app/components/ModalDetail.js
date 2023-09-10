import React, { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { Colors } from '../constants/colors';
import Icon from '../UI/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { urlFor } from '../../sanity';
import FormatReadTime from './FormatReadTime';
import Animated, {
  Easing,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
} from 'react-native-reanimated';

const ModalDetail = ({
  data,
  isModalVisible,
  closeModal,
  onBackdropPress,
  onSwipeComplete,
  handleRead,
}) => {
  const modalOpacity = useSharedValue(0);

  useEffect(() => {
    if (isModalVisible) {
      modalOpacity.value = withTiming(1, { duration: 300, easing: Easing.ease });
    } else {
      modalOpacity.value = withTiming(0, { duration: 300, easing: Easing.ease });
    }
  }, [isModalVisible]);

  const modalStyle = useAnimatedStyle(() => {
    const translateY = interpolate(modalOpacity.value, [0, 1], [300, 0]);
    return {
      opacity: modalOpacity.value,
      transform: [{ translateY }],
    };
  });

  return (
    <Modal
      isVisible={isModalVisible}
      onBackdropPress={onBackdropPress}
      onSwipeComplete={onSwipeComplete}
      swipeDirection="down"
      style={styles.modal}
    >
      <Animated.View style={[styles.innerContainer, modalStyle]}>
        <Image source={{ uri: urlFor(data.imageURL).url() }} style={styles.image} />
        <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
          <Icon name="close-outline" size={23} color={'white'} />
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.author}>{data.tales[0].author}</Text>
          <Text style={styles.category}>{data.tales[0].category}</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detail}>
              <View style={styles.iconTextContainer}>
                <Icon name="heart" size={16} color={Colors.red} />
                <Text style={styles.detailText}>{data.tales[0].likes}</Text>
              </View>
            </View>
            <View style={styles.detail}>
              <View style={styles.iconTextContainer}>
                <Icon name="time" size={16} color={Colors.gray} />
                <Text style={styles.detailText}>{FormatReadTime(data.tales[0].readTime)}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.description}>{data.description}</Text>
          <TouchableOpacity style={styles.readButton} onPress={handleRead}>
            <Text style={styles.readButtonText}>Go to Read</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default ModalDetail;

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    margin: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  innerContainer: {
    backgroundColor: Colors.modalBackground,
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: -100,
    borderRadius: 100,
    resizeMode: 'cover',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  author: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 10,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 5,
  },
  description: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 20,
    lineHeight: 24,
  },
  readButton: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: 40,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
