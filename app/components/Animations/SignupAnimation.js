import React from 'react';
import LottieView from 'lottie-react-native';

export default function SignupAnimation() {
  return (
    <LottieView
      style={{
        width: 290,
        height: 290,
        borderRadius: 6,
        resizeMode: 'cover',
      }}
      source={require('../../../assets/animations/signup.json')}
      autoPlay
      loop
    />
  );
}
