// SPDX-License-Identifier: Apache-2.0
/**
 * SessionSelector — list existing sessions or create a new one.
 */
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Session } from '../types';

interface Props {
  sessionId: string | null;
  onSelect: (id: string) => void;
  onDeleted?: () => void;
}

const STATE_SHORT: Record<string, string> = {
  INGEST_READY:                'Ingest',
  ASR_TRANSCRIBE:              'ASR',
  EXTRACT_STRUCTURED:          'Extract',
  IMAGE_RETRIEVE_SIMILAR_AUTO: 'Imaging',
  DRAFT_NOTE:                  'Draft',
  BUILD_FHIR:                  'FHIR',
  GENERATE_PATIENT_SUMMARY:    'Summary',
  QA_CHECKS:                   'QA',
  READY_FOR_REVIEW:            'Review',
};

export default function SessionSelector({ sessionId, onSelect, onDeleted }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const list = await api.sessions.list();
      setSessions(list.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const deleteSession = async () => {
    if (!sessionId) return;
    if (!confirm('Delete this session and all its data?')) return;
    setDeleting(true);
    try {
      await api.sessions.delete(sessionId);
      await load();
      onDeleted?.();
    } catch {}
    setDeleting(false);
  };

  const create = async () => {
    setCreating(true);
    try {
      const s = await api.sessions.create();
      await load();
      onSelect(s.id);
    } catch {}
    setCreating(false);
  };

  const active = sessions.find((s) => s.id === sessionId);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <select
        value={sessionId ?? ''}
        onChange={(e) => e.target.value && onSelect(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '6px',
          padding: '0.3rem 0.6rem',
          fontSize: '0.9rem',
          width: '240px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      >
        {sessions.length === 0
          ? <option value="" style={{ color: '#111', background: '#fff' }}>No sessions yet</option>
          : <option value="" style={{ color: '#111', background: '#fff' }}>— select session —</option>
        }
        {sessions.map((s) => {
          const date = new Date(s.created_at).toLocaleString(undefined, {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          });
          const state = STATE_SHORT[s.state] ?? s.state;
          return (
            <option key={s.id} value={s.id} style={{ color: '#111', background: '#fff' }}>
              {date}  ·  {state}
            </option>
          );
        })}
      </select>

      <button
        onClick={create}
        disabled={creating}
        style={{
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.35)',
          borderRadius: '6px',
          padding: '0.3rem 0.65rem',
          fontSize: '0.9rem',
          cursor: creating ? 'not-allowed' : 'pointer',
          opacity: creating ? 0.6 : 1,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {creating ? '…' : '+ New'}
      </button>

      {/* Delete current session */}
      {sessionId && (
        <button
          onClick={deleteSession}
          disabled={deleting}
          title="Delete this session"
          style={{
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            padding: '0.3rem 0.55rem',
            fontSize: '0.9rem',
            cursor: deleting ? 'not-allowed' : 'pointer',
            opacity: deleting ? 0.4 : 1,
            fontFamily: 'inherit',
            lineHeight: 1,
          }}
        >
          {deleting ? '…' : '🗑'}
        </button>
      )}

    </div>
  );
}
