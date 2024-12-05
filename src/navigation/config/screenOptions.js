import { Colors } from '../../constants/colors';

export const screenOptions = {
  transparentHeader: {
    headerTransparent: true,
    headerTintColor: Colors.white,
    headerTitle: '',
  },
  categoryHeader: (title) => ({
    title,
    headerTintColor: Colors.white,
    headerStyle: { backgroundColor: Colors.dark900 },
  }),
  allTalesHeader: {
    headerTintColor: Colors.white,
    headerStyle: { backgroundColor: Colors.dark900 },
    headerTitle: 'Here are all the tales',
  },
};
