import { useSignIn } from '@clerk/expo/legacy';
import Constants from 'expo-constants';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import ProviderButton from './ProviderButton';
import { AuthMessage } from './AuthFrame';
import { authError } from '../../services/authFlow';
export default function SocialButtons() {
  const {signIn,isLoaded}=useSignIn();
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
  const settings=Constants.expoConfig?.extra||{};
  async function start(provider) {
    if(!isLoaded||lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try{await signIn.authenticateWithRedirect({strategy:`oauth_${provider}`,redirectUrl:`${window.location.origin}/sso-callback`,redirectUrlComplete:`${window.location.origin}/`});}
    catch(failure){setError(authError(failure));}
    finally{lock.current=false;setBusy(false);}
  }
  return <View>{settings.appleSignInEnabled && <ProviderButton provider="apple" disabled={busy||!isLoaded} onPress={()=>start('apple')}/>}{settings.googleSignInEnabled && <ProviderButton provider="google" disabled={busy||!isLoaded} onPress={()=>start('google')}/>}<AuthMessage>{error}</AuthMessage></View>;
}
