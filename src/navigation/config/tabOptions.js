import { Colors } from '../../constants/colors';

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
