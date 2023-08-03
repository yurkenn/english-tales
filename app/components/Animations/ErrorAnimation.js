import React from 'react';
import LottieView from 'lottie-react-native';
import { View } from 'react-native';

export default function ErrorAnimation() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <LottieView
        style={{
          width: 190,
          height: 190,
        }}
        source={require('../../../assets/animations/error.json')}
        autoPlay
        loop
      />
    </View>
  );
}
