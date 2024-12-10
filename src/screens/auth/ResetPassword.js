import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';
import { auth } from '../../../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const resetValidationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const ResetPassword = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (values) => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, values.email);
      setResetSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.description}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={resetValidationSchema}
          onSubmit={handleResetPassword}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
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

              <CustomButton
                onPress={handleSubmit}
                title={resetSent ? 'Reset Link Sent' : 'Send Reset Link'}
                loading={isLoading}
                disabled={resetSent}
                style={styles.button}
              />

              <CustomButton
                onPress={() => navigation.goBack()}
                title="Back to Login"
                variant="text"
              />
            </View>
          )}
        </Formik>
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
