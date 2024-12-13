import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Formik } from 'formik';
import { AuthContext } from '../../store/AuthContext';
import { useContext } from 'react';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';
import Icon from '../../components/Icons';
import { signupValidationSchema } from '../../components/Auth/Validation';

const Signup = ({ navigation }) => {
  const { createUser, promptAsync } = useContext(AuthContext);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values, { setFieldError }) => {
    try {
      setIsLoading(true);
      const userCredential = await createUser({
        email: values.email,
        password: values.password,
        displayName: values.displayName.trim(), // Clean the name input
      });

      // Update user profile with display name
      if (userCredential?.user) {
        await updateProfile(userCredential.user, {
          displayName: values.displayName.trim(),
        });
      }
    } catch (error) {
      const errorMessage =
        error.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists.'
          : 'Something went wrong. Please try again.';
      setFieldError('email', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.duration(1000)} style={styles.headerContainer}>
          <Text style={styles.title}>Sign up for English Tales</Text>
          <Text style={styles.subtitle}>Create an account to continue</Text>
        </Animated.View>

        <Formik
          initialValues={{
            displayName: '',
            email: '',
            password: '',
            acceptPrivacy: false,
          }}
          validationSchema={signupValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <Animated.View
              entering={FadeInDown.duration(1000).delay(200)}
              style={styles.formContainer}
            >
              <View style={styles.inputGroup}>
                <CustomInput
                  placeholder="Your name"
                  value={values.displayName}
                  onChangeText={handleChange('displayName')}
                  onFocus={() => setFocusedInput('displayName')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('displayName');
                  }}
                  error={touched.displayName && errors.displayName}
                  icon="person"
                />
                {touched.displayName && errors.displayName && (
                  <Text style={styles.errorText}>{errors.displayName}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <CustomInput
                  placeholder="Email address"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('email');
                  }}
                  error={touched.email && errors.email}
                  icon="mail"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <CustomInput
                  placeholder="Password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('password');
                  }}
                  isSecure={true}
                  error={touched.password && errors.password}
                  icon="lock-closed"
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.privacyContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFieldValue('acceptPrivacy', !values.acceptPrivacy)}
                >
                  <Icon
                    name={values.acceptPrivacy ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={values.acceptPrivacy ? Colors.primary : Colors.gray500}
                  />
                </TouchableOpacity>

                <View style={styles.privacyText}>
                  <Text style={styles.privacyLabel}>I agree to the </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                    <Text style={styles.privacyLink}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {touched.acceptPrivacy && errors.acceptPrivacy && (
                <Text style={styles.errorText}>{errors.acceptPrivacy}</Text>
              )}

              <View style={styles.buttonGroup}>
                <CustomButton
                  onPress={handleSubmit}
                  title="Create Account"
                  loading={isLoading}
                  disabled={!values.acceptPrivacy || isLoading}
                  variant="filled"
                  style={!values.acceptPrivacy ? styles.disabledButton : null}
                />

                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                <CustomButton
                  onPress={() => promptAsync()}
                  title="Continue with Google"
                  variant="outlined"
                  imageSource={require('../../../assets/images/google.png')}
                />
              </View>
            </Animated.View>
          )}
        </Formik>

        <Animated.View entering={FadeInDown.duration(1000).delay(400)} style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginButton}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: hp(8),
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    color: Colors.gray300,
  },
  formContainer: {
    gap: spacing.lg,
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
  buttonGroup: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark300,
  },
  dividerText: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  footerText: {
    color: Colors.gray300,
    fontSize: fontSizes.md,
  },
  loginButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  loginText: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  checkbox: {
    padding: spacing.xs,
  },
  privacyText: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    marginLeft: spacing.xs,
  },
  privacyLabel: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
  },
  privacyLink: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default Signup;
