/**
 * Native Firebase Configuration - Modular API
 * Uses @react-native-firebase/* packages with modular imports
 */

import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// Export modular Firebase instances
export const auth = getAuth();
export const db = getFirestore();
