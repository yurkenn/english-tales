import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Formik } from 'formik';
import { signupValidationSchema } from '../../components/Auth/Validation';
import { AuthContext } from '../../store/AuthContext';
import { useContext, useState } from 'react';
import SignupAnimation from '../../components/Animations/SignupAnimation';
import { Colors } from '../../constants/colors';
import CustomButton from '../../components/CustomButton';

const Signup = ({ navigation }) => {
  const [focusedInput, setFocusedInput] = useState(null);

  const authContext = useContext(AuthContext);

  const handleSubmit = async (values) => {
    authContext.createUser(values);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.animation}>
          <SignupAnimation />
        </View>
        <View>
          <Text style={styles.title}>Create your account</Text>
        </View>

        <Formik
          initialValues={{ email: '', password: '', firstName: '', lastName: '' }}
          onSubmit={(values) => handleSubmit(values)}
          validationSchema={signupValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
            <View style={styles.inner_container}>
              <View style={styles.nameContainer}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="First Name"
                  placeholderTextColor={Colors.white}
                  onChangeText={handleChange('firstName')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('firstName');
                  }}
                  onFocus={() => setFocusedInput('firstName')}
                  value={values.firstName}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.lastNameInput}
                  placeholder="Last Name"
                  placeholderTextColor={Colors.white}
                  onChangeText={handleChange('lastName')}
                  onBlur={() => {
                    setFocusedInput(null);
                    handleBlur('lastName');
                  }}
                  onFocus={() => setFocusedInput('lastName')}
                  value={values.lastName}
                  autoCapitalize="none"
                />
              </View>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  padding: 5,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    paddingLeft: 25,
                  }}
                >
                  {focusedInput === 'firstName' && errors.firstName && (
                    <Text style={styles.errors}>{errors.firstName}</Text>
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    paddingRight: 5,
                  }}
                >
                  {focusedInput === 'lastName' && errors.lastName && (
                    <Text style={styles.errors}>{errors.lastName}</Text>
                  )}
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={Colors.white}
                onChangeText={handleChange('email')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('email');
                }}
                onFocus={() => setFocusedInput('email')}
                value={values.email}
                autoCapitalize="none"
              />
              {focusedInput === 'email' && errors.email && (
                <Text style={styles.errors}>{errors.email}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.white}
                onChangeText={handleChange('password')}
                onBlur={() => {
                  setFocusedInput(null);
                  handleBlur('password');
                }}
                onFocus={() => setFocusedInput('password')}
                value={values.password}
                secureTextEntry
              />
              {focusedInput === 'password' && errors.password && (
                <Text style={styles.errors}>{errors.password}</Text>
              )}
              <CustomButton
                onPress={handleSubmit}
                title="Sign Up"
                style={styles.button}
                textStyle={styles.buttonText}
              />

              <View style={styles.signupContainer}>
                <Text style={styles.signupInfo}>Do you have already an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signupText}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Signup;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: windowHeight * 0.05,
    marginTop: windowHeight * 0.05,
  },
  title: {
    fontSize: windowHeight * 0.04,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: windowHeight * 0.02,
  },
  inner_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: Colors.white,
    fontSize: windowHeight * 0.02,
    lineHeight: 18,
    marginTop: windowHeight * 0.02,
    marginBottom: windowHeight * 0.01,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: windowHeight * 0.02,
    width: windowWidth * 0.8,
  },
  nameInput: {
    width: windowWidth * 0.35,
    height: windowHeight * 0.06,
    padding: windowWidth * 0.02,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: Colors.dark900,
    color: '#bdbdbd',
    fontSize: windowHeight * 0.018,
    lineHeight: 19,
  },
  lastNameInput: {
    width: windowWidth * 0.35,
    height: windowHeight * 0.06,
    padding: windowWidth * 0.02,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: Colors.dark900,
    color: '#bdbdbd',
    fontSize: windowHeight * 0.018,
    lineHeight: 19,
  },

  input: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.06,
    padding: windowWidth * 0.02,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: Colors.dark900,
    color: '#bdbdbd',
    fontSize: windowHeight * 0.018,
    lineHeight: 19,
    marginTop: windowHeight * 0.02,
  },
  button: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.06,
    padding: windowWidth * 0.02,
    marginTop: windowHeight * 0.02,
    backgroundColor: Colors.black,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: windowHeight * 0.018,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: Colors.white,
    fontSize: windowHeight * 0.016,
    lineHeight: 16,
    textAlign: 'right',
    fontWeight: '300',
    marginTop: windowHeight * 0.02,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: windowHeight * 0.035,
  },
  signupInfo: {
    color: Colors.white,
    fontSize: windowHeight * 0.018,
    lineHeight: 18,
    marginRight: 5,
  },
  signupText: {
    color: '#FFA500',
    fontSize: windowHeight * 0.02,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  errors: {
    fontSize: windowHeight * 0.018,
    color: 'red',
    marginTop: windowHeight * 0.01,
    fontWeight: 'normal',
  },
});
