// SPDX-License-Identifier: Apache-2.0
/**
 * ProvenanceHighlighter — renders a transcript with underlined, gray-highlighted
 * clickable spans. Click a span to see its field path, offsets, and confidence.
 */
import React, { useState } from 'react';
import type { ProvenanceSpan } from '../types';

interface Props {
  transcript: string;
  spans: ProvenanceSpan[];
  label?: string;
}

export default function ProvenanceHighlighter({ transcript, spans, label }: Props) {
  const [selected, setSelected] = useState<ProvenanceSpan | null>(null);

  // No transcript — render the spans as a simple list
  if (!transcript) {
    return (
      <div className="mt-4 border border-gray-200 rounded p-4 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Provenance spans{label ? ` — ${label}` : ''}
        </h3>
        <div className="space-y-1">
          {spans.map((s, i) => (
            <div key={i} className="text-xs border border-gray-200 rounded p-2 bg-white">
              <span className="font-mono text-gray-900">{s.field_path}</span>
              {' → '}
              <span className="italic text-gray-600">"{s.text}"</span>
              <span className="ml-2 text-gray-400 font-mono">[{s.start}:{s.end}]</span>
              <span className="ml-2 text-gray-500">{Math.round(s.confidence * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render transcript text with highlighted spans
  const sortedSpans = [...spans].sort((a, b) => a.start - b.start);
  const segments: React.ReactNode[] = [];
  let pos = 0;

  for (const span of sortedSpans) {
    const start = Math.max(pos, 0);
    const end   = Math.min(span.start, transcript.length);
    if (start < end) {
      segments.push(
        <span key={`plain-${pos}`}>{transcript.slice(start, end)}</span>
      );
    }
    if (span.start < transcript.length) {
      const spanEnd = Math.min(span.end, transcript.length);
      segments.push(
        <span
          key={`span-${span.start}`}
          className="provenance-highlight"
          title={`${span.field_path} — ${Math.round(span.confidence * 100)}% confidence`}
          onClick={() => setSelected(selected?.start === span.start ? null : span)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setSelected(selected?.start === span.start ? null : span)}
        >
          {transcript.slice(span.start, spanEnd)}
        </span>
      );
      pos = spanEnd;
    }
  }

  if (pos < transcript.length) {
    segments.push(<span key="tail">{transcript.slice(pos)}</span>);
  }

  return (
    <div className="mt-4 border border-gray-200 rounded overflow-hidden">
      {/* Header */}
      <div className="card-header">
        <span className="text-xs font-semibold text-gray-600">
          Transcript with provenance highlights{label ? ` — ${label}` : ''}
        </span>
        <span className="text-xs text-gray-400">Click a highlighted span for details</span>
      </div>

      {/* Transcript body */}
      <div className="p-4 text-sm leading-relaxed font-mono bg-white max-h-64 overflow-y-auto">
        {segments}
      </div>

      {/* Selected span detail bar */}
      {selected && (
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-2 text-xs text-gray-700 flex items-center gap-4 flex-wrap">
          <span>
            <span className="font-semibold">Field: </span>
            <span className="font-mono">{selected.field_path}</span>
          </span>
          <span>
            <span className="font-semibold">Span: </span>
            <span className="font-mono">[{selected.start}:{selected.end}]</span>
          </span>
          <span>
            <span className="font-semibold">Confidence: </span>
            {Math.round(selected.confidence * 100)}%
          </span>
          <span className="italic text-gray-500">"{selected.text}"</span>
          <button
            className="ml-auto text-gray-400 hover:text-gray-700 text-base leading-none"
            onClick={() => setSelected(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
