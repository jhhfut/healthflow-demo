// SPDX-License-Identifier: Apache-2.0
/**
 * ToolCard — a collapsible card showing a workflow step result.
 */
import React, { useState } from 'react';
import type { ToolCardEvent } from '../types';

interface Props {
  event: ToolCardEvent;
}

const STEP_LABELS: Record<string, string> = {
  ASR_TRANSCRIBE:              'Transcription',
  EXTRACT_STRUCTURED:          'Structured Extraction',
  IMAGE_RETRIEVE_SIMILAR_AUTO: 'Image Similarity Retrieval',
  DRAFT_NOTE:                  'Draft SOAP Note',
  BUILD_FHIR:                  'FHIR Bundle',
  GENERATE_PATIENT_SUMMARY:    'Patient Summary',
  QA_CHECKS:                   'QA Checks',
};

const STATUS_PILL: Record<string, string> = {
  completed: 'pill pill-done',
  running:   'pill pill-running',
  failed:    'pill pill-failed',
  pending:   'pill pill-queued',
  stale:     'pill pill-stale',
};

export default function ToolCard({ event }: Props) {
  const [open, setOpen] = useState(false);
  const label = STEP_LABELS[event.step] ?? event.step;

  return (
    <div className="tool-card chat-event">
      <div className="tool-card-header" onClick={() => setOpen((o) => !o)}>
        <div className="flex items-center gap-2">
          <span className={STATUS_PILL[event.status] ?? 'pill pill-queued'}>
            {event.status}
          </span>
          <span className="text-sm font-medium text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {event.latency_ms != null && <span>{event.latency_ms} ms</span>}
          {event.provider_name && (
            <span className="font-mono">{event.provider_name}</span>
          )}
          <span>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div className="tool-card-body text-xs text-gray-600">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-400">Step</span>
            <span className="font-mono">{event.step}</span>
            {event.provider_name && (
              <>
                <span className="text-gray-400">Provider</span>
                <span className="font-mono">{event.provider_name}</span>
              </>
            )}
            {event.latency_ms != null && (
              <>
                <span className="text-gray-400">Latency</span>
                <span>{event.latency_ms} ms</span>
              </>
            )}
            <span className="text-gray-400">Time</span>
            <span>{new Date(event.ts).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
