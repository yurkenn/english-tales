// src/screens/auth/ResetPassword.js
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';
// Import Redux hooks and actions
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../../store/slices/authSlice';
import SuccessModal from '../../components/Modal/SuccessModal';
import ErrorModal from '../../components/Modal/ErrorModal';

const resetValidationSchema = Yup.object().shape({
  email: Yup.string().email('Please enter a valid email address').required('Email is required'),
});

const ResetPassword = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetPassword = async (values, { setFieldError }) => {
    try {
      await dispatch(resetPassword(values.email)).unwrap();
      setResetEmail(values.email);
      setShowSuccessModal(true);
    } catch (error) {
      // If it's a serious error that requires a modal
      if (error.includes('too many requests') || error.includes('disabled')) {
        setErrorMessage(error);
        setShowErrorModal(true);
      } else {
        // For regular validation errors
        setFieldError('email', error);
      }
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleErrorModalClose = () => {
    setShowErrorModal(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(1000)}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>
        </Animated.View>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={resetValidationSchema}
          onSubmit={handleResetPassword}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <Animated.View entering={FadeInDown.duration(1000).delay(200)} style={styles.form}>
              <View style={styles.inputGroup}>
                <CustomInput
                  placeholder="Email"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  icon="mail"
                  error={touched.email && errors.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <CustomButton
                onPress={handleSubmit}
                title="Send Reset Link"
                loading={loading}
                style={styles.button}
              />

              <CustomButton
                onPress={() => navigation.goBack()}
                title="Back to Sign In"
                variant="text"
              />
            </Animated.View>
          )}
        </Formik>

        <SuccessModal
          visible={showSuccessModal}
          onClose={handleModalClose}
          title="Check Your Email"
          message={`We've sent password reset instructions to ${resetEmail}. Please check your inbox and follow the link to reset your password.`}
          buttonText="Back to Sign In"
        />

        <ErrorModal
          visible={showErrorModal}
          onClose={handleErrorModalClose}
          message={errorMessage}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSizes.md,
    color: Colors.gray300,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
  button: {
    marginTop: spacing.md,
  },
});

export default ResetPassword;
