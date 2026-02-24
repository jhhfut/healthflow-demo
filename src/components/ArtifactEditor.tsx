// SPDX-License-Identifier: Apache-2.0
/**
 * ArtifactEditor — editable SOAP note with save / version tracking.
 * Monochrome: primary button (black), ghost links (underlined), no accent colours.
 */
import React, { useState } from 'react';
import { api } from '../api/client';
import type { SOAPNoteContent } from '../types';

interface Props {
  note: SOAPNoteContent;
  sessionId: string;
  onSaved: () => void;
}

export default function ArtifactEditor({ note, sessionId, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...note });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      await api.artifacts.editNote(sessionId, {
        subjective: draft.subjective,
        objective:  draft.objective,
        assessment: draft.assessment,
        plan:       draft.plan,
      });
      setMessage('Saved — new version created.');
      setEditing(false);
      onSaved();
    } catch (e: unknown) {
      setMessage(`Error: ${(e as Error).message}`);
    }
    setSaving(false);
  };

  const cancel = () => {
    setDraft({ ...note });
    setEditing(false);
    setMessage('');
  };

  const fields: { key: keyof typeof draft; label: string; rows: number }[] = [
    { key: 'subjective', label: 'Subjective', rows: 5 },
    { key: 'objective',  label: 'Objective',  rows: 4 },
    { key: 'assessment', label: 'Assessment', rows: 3 },
    { key: 'plan',       label: 'Plan',       rows: 4 },
  ];

  return (
    <div className="border border-gray-200 rounded overflow-hidden">
      {/* Card header */}
      <div className="card-header">
        <span className="text-sm font-semibold text-gray-700">
          SOAP Note Draft{' '}
          <span className="text-xs font-normal text-gray-400">v{note.version}</span>
        </span>
        {!editing ? (
          <button
            className="btn-ghost"
            onClick={() => { setEditing(true); setDraft({ ...note }); }}
          >
            ✏ Edit
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <button
              className="btn-primary btn-sm"
              onClick={save}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn-ghost" onClick={cancel}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="p-4 space-y-4">
        {fields.map(({ key, label, rows }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {label}
            </label>
            {editing ? (
              <textarea
                rows={rows}
                className="font-mono resize-y"
                value={draft[key] as string}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              />
            ) : (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {(note[key] as string) || '—'}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Citations */}
      {note.citations?.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 font-medium mt-2">Citations</p>
          <p className="text-xs text-gray-600 font-mono mt-0.5">
            {note.citations.join(' ')}
          </p>
        </div>
      )}

      {/* Save feedback */}
      {message && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-700">
          {message}
        </div>
      )}
    </div>
  );
}
