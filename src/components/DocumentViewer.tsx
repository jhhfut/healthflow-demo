// SPDX-License-Identifier: Apache-2.0
/**
 * DocumentViewer — modal showing a RAG chunk with gray-highlighted text.
 * No colour accents: uses light gray for the chunk highlight and monospace
 * for the citation.
 */
import React from 'react';
import type { RAGChunk } from '../types';

interface Props {
  chunk: RAGChunk;
  onClose: () => void;
}

export default function DocumentViewer({ chunk, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{chunk.doc_title}</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{chunk.citation}</p>
          </div>
          <button
            className="text-gray-400 hover:text-gray-900 text-xl leading-none focus-visible:outline-2 focus-visible:outline-gray-900"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex gap-4 text-xs text-gray-400 mb-3 flex-wrap">
            <span>
              Section: <b className="text-gray-600">{chunk.page_or_section ?? '—'}</b>
            </span>
            <span>
              Score: <b className="text-gray-600">{chunk.score.toFixed(4)}</b>
            </span>
            <span>
              Chunk ID:{' '}
              <b className="font-mono text-gray-600">{chunk.chunk_id.slice(0, 12)}…</b>
            </span>
          </div>

          {/* Chunk text — light gray background highlight (monochrome) */}
          <div className="bg-gray-100 border border-gray-200 rounded p-4">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {chunk.text}
            </p>
          </div>

          {/* Citation line */}
          <div className="mt-3 text-xs text-gray-600 font-mono bg-gray-50 border border-gray-200 rounded p-2">
            {chunk.citation}
          </div>
        </div>
      </div>
    </div>
  );
}
