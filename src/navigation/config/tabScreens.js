// src/navigation/config/tabScreens.js
import Home from '../../screens/Home';
import Search from '../../screens/Search';
import Saved from '../../screens/Saved';
import Profile from '../../screens/Profile';
import Icon from '../../components/Icons';
import { Colors } from '../../constants/colors';

export const tabScreens = [
  {
    name: 'Home',
    component: Home,
    options: {
      headerTitle: 'StoryMagic: Read Short Stories',
      tabBarIcon: ({ focused, color }) => <Icon name="home" size={23} color={color} />,
    },
  },
  {
    name: 'Search',
    component: Search,
    options: {
      tabBarIcon: ({ focused, color }) => <Icon name="search" size={23} color={color} />,
    },
  },

  {
    name: 'Saved',
    component: Saved,
    options: {
      tabBarIcon: ({ focused, color }) => <Icon name="bookmark" size={23} color={color} />,
    },
  },
  {
    name: 'Profile',
    component: Profile,
    options: {
      tabBarIcon: ({ focused, color }) => <Icon name="person" size={23} color={color} />,
    },
  },
];

// src/navigation/config/tabOptions.js
export const tabOptions = {
  headerStyle: {
    backgroundColor: Colors.dark500,
    shadowColor: 'transparent',
    elevation: 0,
  },
  headerTitleAlign: 'center',
  headerTitleStyle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  tabBarStyle: {
    backgroundColor: Colors.dark500,
    height: 72,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark900,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
    marginTop: 4,
  },
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.white,
};

// src/navigation/config/screenOptions.js
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
  achievementsHeader: {
    headerShown: false,
  },
};
