import MotionProvider from '../components/motion/MotionProvider';
import BetaProvider from '../components/membership/BetaProvider';
import { ClerkProvider, useSession } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LaunchGate from '../components/launch/LaunchGate';
import { accessState } from '../services/authFlow';
SplashScreen.preventAutoHideAsync().catch(() => {});
const hideNativeSplash = () => { SplashScreen.hideAsync().catch(() => {}); };
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error('Add your Clerk Publishable Key to mobile/.env');
function Routes() {
  const { isLoaded, session } = useSession();
  const state = accessState(isLoaded, session);
  return <LaunchGate ready={state !== 'loading'} onLayout={hideNativeSplash}>{state !== 'loading' && <BetaProvider><Stack screenOptions={{headerShown:false}}>
    <Stack.Protected guard={state === 'signed-out'}><Stack.Screen name="(auth)" /></Stack.Protected>
    <Stack.Protected guard={state === 'pending'}><Stack.Screen name="account-tasks" /></Stack.Protected>
    <Stack.Protected guard={state === 'ready'}>
      <Stack.Screen name="(taps)" />
      <Stack.Screen name="recipe/[id]" /><Stack.Screen name="ai-recipe" />
      <Stack.Screen name="favorite-editor" /><Stack.Screen name="meal-planner" />
      <Stack.Screen name="membership" options={{ presentation: "modal" }} />
      <Stack.Screen name="second-serving" /><Stack.Screen name="scan-ingredients" />
    </Stack.Protected>
  </Stack></BetaProvider>}</LaunchGate>;
}
export default function RootLayout() {
  return <MotionProvider><ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}><Routes /></ClerkProvider></MotionProvider>;
}
