// SPDX-License-Identifier: Apache-2.0
/**
 * InputBar — chat-style input with attach buttons inside the field.
 */
import React, { useRef, useState } from 'react';
import { api } from '../api/client';

interface Props {
  sessionId: string | null;
  onUploaded: (label: string) => void;
  onError: (msg: string) => void;
}

export default function InputBar({ sessionId, onUploaded, onError }: Props) {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const disabled = !sessionId;
  const canSend = !disabled && text.trim().length > 0 && !sending;

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || !sessionId) return;
    setSending(true);
    try {
      await api.ingest.text(sessionId, trimmed);
      onUploaded(trimmed.slice(0, 80) + (trimmed.length > 80 ? '…' : ''));
      setText('');
      // Reset textarea height after clearing
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err: unknown) {
      onError((err as Error).message);
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Auto-grow textarea up to 160px
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    try {
      await api.ingest.audio(sessionId, file);
      onUploaded(`Audio: ${file.name}`);
    } catch (err: unknown) {
      onError((err as Error).message);
    }
    e.target.value = '';
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    try {
      await api.ingest.image(sessionId, file);
      onUploaded(`Image: ${file.name}`);
    } catch (err: unknown) {
      onError((err as Error).message);
    }
    e.target.value = '';
  };

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '0.75rem 1rem',
      background: 'var(--bg)',
    }}>
      <input ref={audioRef} type="file" accept="audio/*,.wav" className="hidden" onChange={handleAudio} />
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

      {/* Chat input card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: '1.5px solid var(--border-strong)',
          borderRadius: '12px',
          background: 'var(--bg)',
          overflow: 'hidden',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--fg)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px rgba(17,17,17,0.08)';
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-strong)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={
            disabled
              ? 'Select or create a session to start…'
              : 'Enter notes, history, lab results…  Shift+Enter for new line'
          }
          value={text}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKey}
          style={{
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            resize: 'none',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            lineHeight: '1.5',
            width: '100%',
            background: 'transparent',
            color: 'var(--fg)',
            fontFamily: 'inherit',
            minHeight: '44px',
            maxHeight: '160px',
          }}
        />

        {/* Bottom toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.6rem 0.4rem 0.75rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          {/* Attach buttons */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              title="Attach audio"
              disabled={disabled}
              onClick={() => audioRef.current?.click()}
              style={attachBtnStyle(disabled)}
            >
              🎙 Audio
            </button>
            <button
              title="Attach image"
              disabled={disabled}
              onClick={() => imageRef.current?.click()}
              style={attachBtnStyle(disabled)}
            >
              🖼 Image
            </button>
          </div>

          {/* Send button */}
          <button
            disabled={!canSend}
            onClick={handleSendText}
            style={{
              background: canSend ? 'var(--fg)' : 'var(--bg-muted)',
              color: canSend ? 'var(--bg)' : 'var(--fg-faint)',
              border: 'none',
              borderRadius: '8px',
              padding: '0.35rem 0.9rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: canSend ? 'pointer' : 'default',
              transition: 'background 0.15s, color 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {sending ? '…' : '↑ Send'}
          </button>
        </div>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--fg-faint)', marginTop: '0.35rem', textAlign: 'center' }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

function attachBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '0.25rem 0.6rem',
    fontSize: '0.8rem',
    color: disabled ? 'var(--fg-faint)' : 'var(--fg-muted)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  };
}
