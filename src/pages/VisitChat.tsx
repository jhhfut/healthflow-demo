// SPDX-License-Identifier: Apache-2.0
/**
 * VisitChat — main chat-centric visit page.
 * Layout: TopBar / [ChatThread + InputBar | ArtifactsPanel]
 */
import React, { useCallback, useState } from 'react';
import { useSession } from '../hooks/useSession';
import { useChatEvents } from '../hooks/useChatEvents';
import { api } from '../api/client';
import TopBar from '../components/TopBar';
import ChatThread from '../components/ChatThread';
import ArtifactsPanel from '../components/ArtifactsPanel';
import InputBar from '../components/InputBar';
import KBModal from '../components/KBModal';
import type { ToolCardEvent, UserUploadEvent, SystemMsgEvent } from '../types';

let _idCounter = 0;
const uid = () => `evt-${++_idCounter}-${Date.now()}`;

export default function VisitChat() {
  const { sessionId, setSessionId } = useSession();
  const { events, push, update, clear } = useChatEvents();
  const [running, setRunning] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const handleRun = useCallback(async () => {
    if (!sessionId || running) return;
    setRunning(true);

    const id = uid();
    const evt: ToolCardEvent = {
      id,
      kind: 'tool_card',
      step: 'pending',
      status: 'running',
      provider_name: null,
      latency_ms: null,
      ts: new Date().toISOString(),
    };
    push(evt);

    try {
      await api.agent.runAsync(sessionId, undefined, (raw) => {
        if (raw.event === 'start') {
          update(id, { step: (raw.step as string) ?? 'pending', status: 'running' });
        } else if (raw.event === 'completed') {
          update(id, {
            step: (raw.step as string) ?? evt.step,
            status: 'completed',
            provider_name: (raw.provider_name as string) ?? null,
            latency_ms: typeof raw.latency_ms === 'number' ? raw.latency_ms : null,
          });
          setRefreshTick((t) => t + 1);
        } else if (raw.event === 'error') {
          update(id, { status: 'failed' });
          const errEvt: SystemMsgEvent = {
            id: uid(),
            kind: 'system_msg',
            text: `Error: ${raw.message ?? 'unknown'}`,
            ts: new Date().toISOString(),
          };
          push(errEvt);
        }
      });
    } catch (e: unknown) {
      update(id, { status: 'failed' });
      push({
        id: uid(),
        kind: 'system_msg',
        text: `Error: ${(e as Error).message}`,
        ts: new Date().toISOString(),
      });
    }
    setRunning(false);
  }, [sessionId, running, push, update]);

  const handleUploaded = (label: string) => {
    const evt: UserUploadEvent = {
      id: uid(),
      kind: 'user_upload',
      label,
      ts: new Date().toISOString(),
    };
    push(evt);
  };

  const handleError = (msg: string) => {
    push({
      id: uid(),
      kind: 'system_msg',
      text: `Upload error: ${msg}`,
      ts: new Date().toISOString(),
    });
  };

  return (
    <div className="chat-layout">
      <TopBar
        sessionId={sessionId}
        onSessionSelect={setSessionId}
        onSessionDeleted={() => { setSessionId(null); clear(); setRefreshTick(0); }}
        running={running}
        onRun={handleRun}
        onOpenKB={() => setKbOpen(true)}
      />

      <div className="chat-body">
        {/* Left column: thread + input */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <ChatThread events={events} />
          <InputBar
            sessionId={sessionId}
            onUploaded={handleUploaded}
            onError={handleError}
          />
        </div>

        <ArtifactsPanel sessionId={sessionId} refreshTick={refreshTick} />
      </div>

      <KBModal open={kbOpen} onClose={() => setKbOpen(false)} />
    </div>
  );
}
