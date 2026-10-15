import { useAuth } from '@clerk/expo';
import { useLayoutEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { bindBetaSession } from '../../services/betaRequest';

export default function BetaProvider({ children }) {
  const { userId, getToken } = useAuth();
  useLayoutEffect(() => {
    bindBetaSession(userId ? { userId, getToken, onQuota: data => {
      const reset = data.resetsAt ? new Date(data.resetsAt).toLocaleDateString() : 'your next monthly reset';
      const message = `Your free beta allowance resets on ${reset}. Browsing, saved recipes, and manual pantry entry are still available.`;
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Free beta allowance reached', message, [
          { text: 'Keep exploring', style: 'cancel' },
          { text: 'View beta usage', onPress: () => router.push('/membership') },
        ]);
      }
    } } : null);
    return () => bindBetaSession(null);
  }, [userId, getToken]);
  return children;
}
