// SPDX-License-Identifier: Apache-2.0
/**
 * TopBar — brand, session selector, offline dot, run controls, disclaimer.
 */
import React from 'react';
import SessionSelector from './SessionSelector';

interface Props {
  sessionId: string | null;
  onSessionSelect: (id: string) => void;
  onSessionDeleted: () => void;
  running: boolean;
  onRun: () => void;
  onOpenKB: () => void;
}

const DISCLAIMER =
  'All outputs require mandatory clinician review before any clinical use. Not intended for diagnosis or clinical decision-making.';

export default function TopBar({
  sessionId,
  onSessionSelect,
  onSessionDeleted,
  running,
  onRun,
  onOpenKB,
}: Props) {
  return (
    <div className="top-bar">
      {/* Brand */}
      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
        HealthFlow
      </span>


      {/* Session selector */}
      <SessionSelector sessionId={sessionId} onSelect={onSessionSelect} onDeleted={onSessionDeleted} />

      {/* Run button */}
      <button
        className="btn-sm"
        style={{
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.4)',
          padding: '0.3rem 0.7rem',
          borderRadius: '4px',
          fontSize: '0.9rem',
          cursor: running || !sessionId ? 'not-allowed' : 'pointer',
          opacity: running || !sessionId ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
        onClick={onRun}
        disabled={running || !sessionId}
      >
        {running ? '⟳ Running…' : '▶ Run Step'}
      </button>

      {/* Knowledge Base button */}
      <button
        style={{
          background: 'transparent',
          color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px',
          fontSize: '0.9rem',
          cursor: 'pointer',
          padding: '0.3rem 0.7rem',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
        }}
        onClick={onOpenKB}
      >
        Knowledge Base
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Disclaimer */}
      <span
        className="text-xs hidden lg:block"
        style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '420px', lineHeight: 1.3 }}
      >
        ⚠ {DISCLAIMER}
      </span>
    </div>
  );
}
