import React, { useState, useEffect } from 'react';
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
import { loginValidationSchema } from '../../components/Auth/Validation';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { scale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleSignIn } from '../../store/slices/authSlice';

WebBrowser.maybeCompleteAuthSession();

const Login = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [focusedInput, setFocusedInput] = useState(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      dispatch(googleSignIn(id_token));
    }
  }, [response]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(loginUser(values)).unwrap();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ResetPassword');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeIn.duration(1000)} style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue reading</Text>
        </Animated.View>

        <Formik
          initialValues={{ email: '', password: '' }}
          onSubmit={handleSubmit}
          validationSchema={loginValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <Animated.View
              entering={FadeInDown.duration(1000).delay(200)}
              style={styles.formContainer}
            >
              <View style={styles.inputGroup}>
                <CustomInput
                  placeholder="Email"
                  onChangeText={handleChange('email')}
                  value={values.email}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('email');
                  }}
                  icon="mail"
                  error={touched.email && errors.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                <View style={styles.passwordContainer}>
                  <CustomInput
                    placeholder="Password"
                    onChangeText={handleChange('password')}
                    value={values.password}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => {
                      setFocusedInput(null);
                      handleBlur('password');
                    }}
                    icon="lock-closed"
                    isSecure={true}
                    error={touched.password && errors.password}
                  />
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordButton}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <CustomButton onPress={handleSubmit} title="Sign In" loading={loading} />

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
                  disabled={!request}
                />
              </View>
            </Animated.View>
          )}
        </Formik>

        <Animated.View entering={FadeInDown.duration(1000).delay(400)} style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupText}>Sign up</Text>
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
  welcomeText: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.lg,
    color: Colors.gray300,
  },
  formContainer: {
    gap: spacing.xl,
  },
  inputGroup: {
    gap: spacing.md,
  },
  buttonGroup: {
    gap: spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
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
  signupText: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  passwordContainer: {
    gap: spacing.xs,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});

export default Login;
