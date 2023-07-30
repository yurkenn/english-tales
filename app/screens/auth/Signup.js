import {
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
import { loginValidationSchema } from '../../components/Auth/Validation';
import { AuthContext } from '../../store/auth-context';
import { useContext } from 'react';
import SignupAnimation from '../../components/Animations/SignupAnimation';

const Signup = ({ navigation }) => {
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
          onSubmit={handleSubmit}
          validationSchema={loginValidationSchema}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors }) => (
            <View style={styles.inner_container}>
              <View style={styles.nameContainer}>
                <TextInput
                  style={styles.nameInput}
                  placeholder="First Name"
                  placeholderTextColor="#fff"
                  onChangeText={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  value={values.firstName}
                  autoCapitalize="none"
                />
                {errors.firstName && <Text style={styles.errors}>{errors.firstName}</Text>}

                <TextInput
                  style={styles.lastNameInput}
                  placeholder="Last Name"
                  placeholderTextColor="#fff"
                  onChangeText={handleChange('lastName')}
                  onBlur={handleBlur('lastName')}
                  value={values.lastName}
                  autoCapitalize="none"
                />
                {errors.lastName && <Text style={styles.errors}>{errors.lastName}</Text>}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#fff"
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                value={values.email}
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errors}>{errors.email}</Text>}

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#fff"
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                value={values.password}
                secureTextEntry
              />
              {errors.password && <Text style={styles.errors}>{errors.password}</Text>}
              <TouchableOpacity onPress={handleSubmit} style={styles.button}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupInfo}>Do you have already an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signupText}>Sign up</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },

  animation: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 40,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 52,
    textAlign: 'center',
    marginBottom: 20,
  },
  inner_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: 311,
  },
  nameInput: {
    width: 120,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: '#161616',
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
  },
  lastNameInput: {
    width: 150,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: '#161616',
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
  },

  input: {
    width: 311,
    height: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    backgroundColor: '#161616',
    color: '#bdbdbd',
    fontSize: 14,
    lineHeight: 19,
    marginTop: 20,
  },
  button: {
    width: 311,
    height: 48,
    padding: 8,
    marginTop: 20,
    backgroundColor: '#000000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    fontWeight: '300',
    marginTop: 10,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  signupInfo: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    marginRight: 5,
  },
  signupText: {
    color: '#FFA500',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: 'bold',
  },
  errors: {
    fontSize: 14,
    color: 'red',
    marginTop: 3,
    fontWeight: 'normal',
  },
});
