import { useClerk, useSession } from '@clerk/expo';
import { useSignUp } from '@clerk/expo/legacy';
import { SignIn, SignUp } from '@clerk/expo/web';
import { Text } from 'react-native';
import { useState } from 'react';
import AuthFrame,{AuthButton,AuthMessage,ui} from './AuthFrame';
import { authError } from '../../services/authFlow';
export default function CompleteAccount(){
 const clerk=useClerk();const {session}=useSession();const {signUp}=useSignUp();const [error,setError]=useState('');
 const appearance={variables:{colorPrimary:'#245B4B',colorBackground:'#FFFFFF',borderRadius:'12px'}};
 return <AuthFrame><Text style={ui.title}>Finish your account</Text><AuthMessage>{error}</AuthMessage>
 {(session?.currentTask || session?.status==='pending') ? <AuthButton title="Complete account verification" onPress={()=>clerk.redirectToTasks({redirectUrl:window.location.origin+'/'}).catch(failure=>setError(authError(failure)))}/> : signUp?.status==='missing_requirements'?<SignUp routing="hash" forceRedirectUrl="/" signInUrl="/sign-in" appearance={appearance}/>:<SignIn routing="hash" forceRedirectUrl="/" signUpUrl="/sign-up" appearance={appearance}/>}
 <AuthButton secondary title="Use a different account" onPress={()=>clerk.signOut({redirectUrl:'/welcome'}).catch(failure=>setError(authError(failure)))}/></AuthFrame>;
}
