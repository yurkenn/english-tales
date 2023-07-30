import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { createContext, useEffect, useState } from 'react';
import { auth, firestore } from '../../firebaseConfig';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log('THIS IS USER', user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        console.log('User Logged in!', user);
      } else {
        setUser(null);
        console.log('User Logged out!');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (values) => {
    try {
      const login = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log('Login', login);
    } catch (error) {
      console.log('Login Error', error);
      throw error;
    }
  };

  const createUser = async (values) => {
    try {
      const signup = await createUserWithEmailAndPassword(auth, values.email, values.password);

      if (signup.user) {
        const { firstName, lastName, email } = values;
        const userUid = signup.user.uid;

        await setDoc(doc(firestore, 'users', userUid), {
          uid: userUid,
          firstName,
          lastName,
          email,
        });
        console.log('User data saved to Firestore!', { firstName, lastName, email, uid: userUid });
      }
    } catch (error) {
      console.log('Signup Error', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.log('Logout Error', error);
      throw error;
    }
  };

  const values = {
    user,
    setUser,
    loading,
    setLoading,
    handleLogin,
    createUser,
    handleLogout,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
