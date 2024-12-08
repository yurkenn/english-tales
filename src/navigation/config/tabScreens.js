import Home from '../../screens/Home';
import Search from '../../screens/Search';
import Saved from '../../screens/Saved';
import Profile from '../../screens/Profile';
import Icon from '../../components/Icons';

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
