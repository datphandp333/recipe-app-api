import { ClerkProvider, useSession } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { accessState } from '../services/authFlow';
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error('Add your Clerk Publishable Key to mobile/.env');
function Routes() {
  const { isLoaded, session } = useSession();
  const state = accessState(isLoaded, session);
  if (state === 'loading') return <View style={{flex:1,backgroundColor:'white',justifyContent:'center'}}><ActivityIndicator accessibilityLabel="Loading your account" color="#245B4B" /></View>;
  return <Stack screenOptions={{headerShown:false}}>
    <Stack.Protected guard={state === 'signed-out'}><Stack.Screen name="(auth)" /></Stack.Protected>
    <Stack.Protected guard={state === 'pending'}><Stack.Screen name="account-tasks" /></Stack.Protected>
    <Stack.Protected guard={state === 'ready'}>
      <Stack.Screen name="(taps)" />
      <Stack.Screen name="recipe/[id]" /><Stack.Screen name="ai-recipe" />
      <Stack.Screen name="favorite-editor" /><Stack.Screen name="meal-planner" />
      <Stack.Screen name="second-serving" /><Stack.Screen name="scan-ingredients" />
    </Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  return <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><Routes /></ClerkProvider>;
}
