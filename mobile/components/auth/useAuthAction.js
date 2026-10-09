import { useRef, useState } from 'react';
// Keep one action in flight across multi-request verification/finalization flows.
export default function useAuthAction() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = async action => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await action(); } finally { lock.current = false; setBusy(false); }
  };
  return { busy, run };
}
