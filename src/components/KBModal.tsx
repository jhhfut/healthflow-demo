// SPDX-License-Identifier: Apache-2.0
/**
 * KBModal — modal wrapper around the KnowledgeBase page content.
 */
import React from 'react';
import KnowledgeBase from '../pages/KnowledgeBase';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function KBModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="card-header">
          <span className="text-sm font-semibold">Knowledge Base</span>
          <button className="btn-ghost" onClick={onClose}>✕ Close</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <KnowledgeBase />
        </div>
      </div>
    </div>
  );
}
