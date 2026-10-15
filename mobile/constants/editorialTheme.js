import { Platform } from 'react-native';
export const EDITORIAL_COLORS = {
  background: '#FBF7EF', surface: '#FFFFFF', white: '#FFFFFF', ink: '#233C30',
  green: '#245B4B', dark: '#173E33', muted: '#657064', gold: '#936638',
  coral: '#B94C34', yellow: '#F5ECD8', cream: '#F5ECD8', sage: '#E7EEE4', line: '#E7E3D9',
};
export const EDITORIAL_FONT = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
