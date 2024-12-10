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
import { signupValidationSchema } from '../../components/Auth/Validation';
import { AuthContext } from '../../store/AuthContext';
import { useContext } from 'react';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import SignupAnimation from '../../components/Animations/SignupAnimation';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { scale, verticalScale, spacing, fontSizes, wp, hp } from '../../utils/dimensions';

const Signup = ({ navigation }) => {
  const { createUser } = useContext(AuthContext);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleSubmit = async (values) => {
    createUser(values);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={[Colors.dark500, Colors.dark900]} style={styles.gradientBackground}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            entering={FadeInDown.duration(1000).springify()}
            style={styles.animationContainer}
          >
            <SignupAnimation />
          </Animated.View>

          <Animated.Text entering={FadeInDown.duration(1000).delay(200)} style={styles.title}>
            Create your account
          </Animated.Text>

          <Formik
            initialValues={{ email: '', password: '', firstName: '', lastName: '' }}
            onSubmit={handleSubmit}
            validationSchema={signupValidationSchema}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
              <Animated.View
                entering={FadeInDown.duration(1000).delay(400)}
                style={styles.formContainer}
              >
                <View style={styles.nameContainer}>
                  <View style={styles.nameField}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <CustomInput
                      placeholder="First Name"
                      value={values.firstName}
                      onChangeText={handleChange('firstName')}
                      onFocus={() => setFocusedInput('firstName')}
                      onBlur={() => {
                        setFocusedInput(null);
                        handleBlur('firstName');
                      }}
                      style={styles.nameInput}
                    />
                    {errors.firstName && focusedInput === 'firstName' && (
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    )}
                  </View>

                  <View style={styles.nameField}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <CustomInput
                      placeholder="Last Name"
                      value={values.lastName}
                      onChangeText={handleChange('lastName')}
                      onFocus={() => setFocusedInput('lastName')}
                      onBlur={() => {
                        setFocusedInput(null);
                        handleBlur('lastName');
                      }}
                      style={styles.nameInput}
                    />
                    {errors.lastName && focusedInput === 'lastName' && (
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    )}
                  </View>
                </View>

                <Text style={styles.inputLabel}>Email</Text>
                <CustomInput
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('email');
                  }}
                  icon="mail"
                />
                {errors.email && focusedInput === 'email' && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}

                <Text style={styles.inputLabel}>Password</Text>
                <CustomInput
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('password');
                  }}
                  icon="lock-closed"
                  isSecure={true}
                />
                {errors.password && focusedInput === 'password' && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}

                <CustomButton onPress={handleSubmit} title="Sign Up" style={styles.signupButton} />

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Log In</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </Formik>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: verticalScale(20),
    paddingBottom: spacing.xl,
  },
  animationContainer: {
    width: wp(80),
    height: hp(30),
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  formContainer: {
    gap: spacing.md,
  },
  nameContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  nameInput: {
    width: '100%',
  },
  inputLabel: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  signupButton: {
    marginTop: spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  loginText: {
    color: Colors.gray500,
    fontSize: fontSizes.md,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});

export default Signup;
