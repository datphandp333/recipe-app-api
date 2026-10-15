import { randomUUID, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { createBetaClient } from './betaClient';
const client = createBetaClient({
  fetchImpl: (...args) => fetch(...args),
  randomId: randomUUID,
  hashBody: body => digestStringAsync(CryptoDigestAlgorithm.SHA256, body),
});
export const bindBetaSession = value => client.bind(value);
export const betaFetch = (...args) => client.fetch(...args);
