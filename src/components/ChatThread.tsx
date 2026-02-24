// SPDX-License-Identifier: Apache-2.0
/**
 * ChatThread — scrollable list of chat events with auto-scroll.
 */
import React, { useEffect, useRef } from 'react';
import type { ChatEvent } from '../types';
import ToolCard from './ToolCard';

interface Props {
  events: ChatEvent[];
}

export default function ChatThread({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="chat-thread flex-1 items-center justify-center">
        <div className="text-center text-gray-400 text-sm py-16">
          <p className="font-medium mb-1">No activity yet</p>
          <p>Create or select a session, upload audio, then run the workflow.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-thread flex-1">
      {events.map((evt) => {
        if (evt.kind === 'tool_card') {
          return <ToolCard key={evt.id} event={evt} />;
        }
        if (evt.kind === 'user_upload') {
          return (
            <div key={evt.id} className="chat-event flex justify-end">
              <div className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 max-w-xs">
                {evt.label}
              </div>
            </div>
          );
        }
        if (evt.kind === 'system_msg') {
          return (
            <div key={evt.id} className="chat-event text-center text-xs text-gray-400 py-1">
              {evt.text}
            </div>
          );
        }
        return null;
      })}
      <div ref={bottomRef} />
    </div>
  );
}
