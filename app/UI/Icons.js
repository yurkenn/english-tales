import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';

export const HomeIcon = () => {
  return <MaterialIcons name="home" size={23} color="white" />;
};

export const SearchIcon = () => {
  return <Ionicons name="md-search-sharp" size={23} color="white" />;
};

export const ListenIcon = () => {
  return <Ionicons name="play-circle" size={23} color="white" />;
};

export const SavedIcon = () => {
  return <Ionicons name="ios-bookmark" size={24} color="white" />;
};

export const ProfileIcon = () => {
  return <Ionicons name="person" size={23} color="white" />;
};

export const LogoutIcon = () => {
  return <Ionicons name="log-out-outline" size={23} color="white" />;
};

export const LikeIcon = () => {
  return <AntDesign name="like2" size={24} color="white" />;
};

export const BookmarkOutlineIcon = () => {
  return <Ionicons name="bookmarks-outline" size={24} color="white" />;
};
