// SPDX-License-Identifier: Apache-2.0
/**
 * useChatEvents — append-only event log for the chat thread.
 */
import { useState, useCallback } from 'react';
import type { ChatEvent } from '../types';

export function useChatEvents() {
  const [events, setEvents] = useState<ChatEvent[]>([]);

  const push = useCallback((evt: ChatEvent) => {
    setEvents((prev) => [...prev, evt]);
  }, []);

  const update = useCallback((id: string, patch: Record<string, unknown>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? ({ ...e, ...patch } as ChatEvent) : e))
    );
  }, []);

  const clear = useCallback(() => setEvents([]), []);

  return { events, push, update, clear };
}
