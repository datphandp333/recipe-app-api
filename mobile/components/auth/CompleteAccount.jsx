import { useHostedAuth } from '@clerk/expo/hosted-auth';
import { useClerk } from '@clerk/expo';
import { useRef, useState } from 'react';
import Constants from 'expo-constants';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AuthFrame,{AuthButton,AuthMessage,ui} from './AuthFrame';
import { authError } from '../../services/authFlow';
export default function CompleteAccount() {
  const {startHostedAuth}=useHostedAuth();const {signOut}=useClerk();
  const {mode}=useLocalSearchParams(); const router=useRouter();
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
  const expoGo=Constants.executionEnvironment==='storeClient';
  async function finish(){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try {await startHostedAuth({mode:mode==='signUp'?'sign-up':'sign-in',redirectUrl:'clerkexpo://hosted-auth-callback'});}
    catch(failure){setError(authError(failure));}finally{lock.current=false;setBusy(false);}
  }
  async function differentAccount(){if(lock.current)return;lock.current=true;setBusy(true);try{await signOut();router.replace('/(auth)/welcome');}catch(failure){setError(authError(failure));}finally{lock.current=false;setBusy(false);}}
  return <AuthFrame><Text style={ui.title}>Finish your account</Text><Text style={ui.body}>Clerk needs an additional verification or account detail before you can enter Simmerli. Continue securely in your browser to finish. You may be asked to sign in again.</Text>
    <AuthMessage>{error}</AuthMessage>
    {expoGo?<Text style={ui.body}>This account needs a verification flow that requires the Simmerli development build. Open that build to continue.</Text>:<AuthButton title={busy?'Please wait…':'Continue securely with Clerk'} disabled={busy} onPress={finish}/>}
    <AuthButton secondary title="Use a different account" disabled={busy} onPress={differentAccount}/>
  </AuthFrame>;
}
