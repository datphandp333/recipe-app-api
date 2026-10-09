import test from 'node:test';
import assert from 'node:assert/strict';
import { accessState, socialOutcome, authError } from '../services/authFlow.js';
test('protected routes require a loaded, active session without tasks',()=>{
 assert.equal(accessState(false,{status:'active'}),'loading');
 assert.equal(accessState(true,null),'signed-out');
 assert.equal(accessState(true,{status:'active'}),'ready');
 assert.equal(accessState(true,{status:'pending'}),'pending');
 assert.equal(accessState(true,{status:'active',currentTask:{key:'setup-mfa'}}),'pending');
 for(const status of ['ended','expired','revoked','abandoned'])assert.equal(accessState(true,{status}),'signed-out');
});
test('incomplete social accounts never count as authenticated',()=>{
 assert.equal(socialOutcome({createdSessionId:'sess_123'}),'complete');
 assert.equal(socialOutcome({signIn:{status:'needs_second_factor'}}),'requirements');
 assert.equal(socialOutcome({signUp:{status:'missing_requirements'}}),'requirements');
 assert.equal(socialOutcome({signIn:{status:'needs_protect_check'}}),'requirements');
 assert.equal(socialOutcome({authSessionResult:{type:'cancel'},signIn:{status:'needs_second_factor'}}),'canceled');
 assert.equal(socialOutcome({createdSessionId:null}),'canceled');
});
test('canceled provider prompts are quiet and network errors are readable',()=>{
 for(const code of ['ERR_REQUEST_CANCELED','SIGN_IN_CANCELLED','-5','12501'])assert.equal(authError({code}),'');
 assert.match(authError(new Error('Network request failed')),/Check your connection/);
 assert.equal(authError({errors:[{longMessage:'This email is already in use.'}]}),'This email is already in use.');
});
