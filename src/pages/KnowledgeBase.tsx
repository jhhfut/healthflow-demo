// SPDX-License-Identifier: Apache-2.0
import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { EvidenceContent, RAGDocument, RAGChunk } from '../types';
import DocumentViewer from '../components/DocumentViewer';

export default function KnowledgeBase() {
  const [docs, setDocs] = useState<RAGDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EvidenceContent | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<RAGChunk | null>(null);
  const [status, setStatus] = useState('');

  const loadDocs = async () => {
    try {
      const d = await api.rag.listDocuments();
      setDocs(d);
    } catch {}
  };

  useEffect(() => { loadDocs(); }, []);

  const upload = async () => {
    if (!file || !title) return;
    setUploading(true);
    try {
      await api.rag.uploadDocument(title, file);
      setStatus('Document uploaded and indexed.');
      setTitle('');
      setFile(null);
      await loadDocs();
    } catch (e: unknown) {
      setStatus(`Upload failed: ${(e as Error).message}`);
    }
    setUploading(false);
  };

  const search = async () => {
    if (!query) return;
    setSearching(true);
    try {
      const r = await api.rag.search(query, 5);
      setResults(r);
    } catch (e: unknown) {
      setStatus(`Search failed: ${(e as Error).message}`);
    }
    setSearching(false);
  };

  return (
    <div>
      <h1 className="mb-2">Knowledge Base</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload local reference documents (TXT / MD). Chunks are indexed for hybrid
        semantic + keyword retrieval. All data stays offline.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Upload */}
        <div className="border border-gray-200 rounded p-5">
          <h2 className="mb-3">Upload Document</h2>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="file"
              accept=".txt,.md,.csv"
              className="text-xs !w-auto !border-none !p-0 !shadow-none"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div>
              <button
                className="btn-primary"
                onClick={upload}
                disabled={uploading || !file || !title}
              >
                {uploading ? 'Uploading...' : 'Upload & Index'}
              </button>
            </div>
          </div>

          {docs.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Indexed documents ({docs.length})
              </h3>
              <div className="space-y-1.5">
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-xs border border-gray-200 rounded px-2 py-1.5 bg-gray-50"
                  >
                    <span className="font-medium text-gray-800">{d.title}</span>
                    <span className="text-gray-400">{d.chunk_count} chunks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="border border-gray-200 rounded p-5">
          <h2 className="mb-3">Search</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter clinical query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <button
              className="btn-primary"
              onClick={search}
              disabled={searching || !query}
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>

          {results && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.chunks.length === 0 && (
                <p className="text-sm text-gray-400">No results found.</p>
              )}
              {results.chunks.map((chunk) => (
                <button
                  key={chunk.chunk_id}
                  className="w-full text-left border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-gray-900"
                  onClick={() => setSelectedChunk(chunk)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-mono font-semibold text-gray-800">
                      {chunk.citation}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {chunk.score.toFixed(3)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{chunk.text}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {status && (
        <div className="mt-4 notice">{status}</div>
      )}

      {selectedChunk && (
        <DocumentViewer chunk={selectedChunk} onClose={() => setSelectedChunk(null)} />
      )}
    </div>
  );
}
