// SPDX-License-Identifier: Apache-2.0
/**
 * Tiny session-ID persistence hook — stores active session in localStorage.
 */
import { useState } from 'react';

const KEY = 'healthflow_session_id';

export function useSession() {
  const [sessionId, setSessionIdState] = useState<string | null>(
    () => localStorage.getItem(KEY)
  );

  const setSessionId = (id: string | null) => {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    setSessionIdState(id);
  };

  return { sessionId, setSessionId };
}
