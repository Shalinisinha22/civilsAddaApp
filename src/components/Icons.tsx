import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: any;
};

export const Icon: React.FC<IconProps & { library?: 'material' | 'materialCommunity' | 'ionicons' }> = ({
  name,
  size = 20,
  color = '#000',
  style,
  library = 'material',
}) => {
  const iconProps = { name, size, color, style };

  switch (library) {
    case 'materialCommunity':
      return <MaterialCommunityIcons {...iconProps} />;
    case 'ionicons':
      return <Ionicons {...iconProps} />;
    default:
      return <MaterialIcons {...iconProps} />;
  }
};

  // Category icons
export const CategoryIcon: React.FC<{ category?: string; size?: number; color?: string }> = ({
  category,
  size = 24,
  color,
}) => {
  const iconMap: Record<string, { name: string; library: 'material' | 'materialCommunity' | 'ionicons' }> = {
    polity: { name: 'account-balance', library: 'material' },
    history: { name: 'history', library: 'material' },
    geography: { name: 'public', library: 'material' },
    economy: { name: 'trending-up', library: 'material' },
    science: { name: 'science', library: 'material' },
    'current-affairs': { name: 'newspaper', library: 'materialCommunity' },
    'previous-year-papers': { name: 'library-books', library: 'material' },
    uncategorized: { name: 'category', library: 'material' },
  };

  const icon = iconMap[category || ''] || { name: 'menu-book', library: 'material' };
  return <Icon name={icon.name} size={size} color={color} library={icon.library} />;
};

// Common icons
export const Icons = {
  Book: (props: { size?: number; color?: string }) => <Icon name="menu-book" {...props} />,
  Document: (props: { size?: number; color?: string }) => <Icon name="description" {...props} />,
  Clock: (props: { size?: number; color?: string }) => <Icon name="access-time" {...props} />,
  Money: (props: { size?: number; color?: string }) => <Icon name="attach-money" {...props} />,
  Target: (props: { size?: number; color?: string }) => <Icon name="gps-fixed" {...props} />,
  Check: (props: { size?: number; color?: string }) => <Icon name="check" {...props} />,
  Star: (props: { size?: number; color?: string }) => <Icon name="star" {...props} />,
  Warning: (props: { size?: number; color?: string }) => <Icon name="warning" {...props} />,
  Celebration: (props: { size?: number; color?: string }) => <Icon name="celebration" {...props} />,
  Lightbulb: (props: { size?: number; color?: string }) => <Icon name="lightbulb" {...props} />,
  Dashboard: (props: { size?: number; color?: string }) => <Icon name="dashboard" {...props} />,
  Tests: (props: { size?: number; color?: string }) => <Icon name="quiz" {...props} />,
  Attempts: (props: { size?: number; color?: string }) => <Icon name="assignment" {...props} />,
  Question: (props: { size?: number; color?: string }) => <Icon name="help-outline" {...props} />,
  Questions: (props: { size?: number; color?: string }) => <Icon name="question-answer" {...props} />,
  Statistics: (props: { size?: number; color?: string }) => <Icon name="bar-chart" {...props} />,
  Cart: (props: { size?: number; color?: string }) => <Icon name="shopping-cart" {...props} />,
  Settings: (props: { size?: number; color?: string }) => <Icon name="settings" {...props} />,
  Trending: (props: { size?: number; color?: string }) => <Icon name="trending-up" {...props} />,
  Home: (props: { size?: number; color?: string }) => <Icon name="home" {...props} />,
  MedalGold: (props: { size?: number; color?: string }) => <Icon name="emoji-events" {...props} library="material" />,
  MedalSilver: (props: { size?: number; color?: string }) => <Icon name="workspace-premium" {...props} library="material" />,
  MedalBronze: (props: { size?: number; color?: string }) => <Icon name="military-tech" {...props} library="material" />,
  Trophy: (props: { size?: number; color?: string }) => <Icon name="emoji-events" {...props} library="material" />,
  Bookmark: (props: { size?: number; color?: string }) => <Icon name="collections-bookmark" {...props} library="material" />,
  Inventory: (props: { size?: number; color?: string }) => <Icon name="widgets" {...props} library="material" />,
  Lock: (props: { size?: number; color?: string }) => <Icon name="lock" {...props} library="material" />,
  Language: (props: { size?: number; color?: string }) => <Icon name="language" {...props} library="ionicons" />,
  Assignment: (props: { size?: number; color?: string }) => <Icon name="assignment" {...props} library="material" />,
  Close: (props: { size?: number; color?: string }) => <Icon name="close" {...props} library="material" />,
  Logout: (props: { size?: number; color?: string }) => <Icon name="logout" {...props} library="material" />,
  School: (props: { size?: number; color?: string }) => <Icon name="school" {...props} library="material" />,
  ShowChart: (props: { size?: number; color?: string }) => <Icon name="show-chart" {...props} library="material" />,
};

