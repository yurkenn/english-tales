import React from 'react';
import LottieView from 'lottie-react-native';

export default function SignupAnimation() {
  return <LottieView source={require('../../../assets/animations/signup.json')} autoPlay loop />;
}
