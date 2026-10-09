import { Stack } from 'expo-router';
export const unstable_settings = { initialRouteName: 'welcome' };
export default function AuthRoutesLayout() {
  return <Stack initialRouteName="welcome" screenOptions={{headerShown:false}} />;
}
