// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import VisitChat from './pages/VisitChat';
import KnowledgeBase from './pages/KnowledgeBase';

const DEMO_BANNER = (
  <div style={{
    background: '#1d4ed8',
    color: 'white',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '0.35rem 1rem',
    letterSpacing: '0.01em',
  }}>
    Interactive demo, all data is simulated.
    &nbsp;
    <a
      href="https://github.com/jhhfut/healthflow"
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}
    >
      View source on GitHub
    </a>
  </div>
);

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {DEMO_BANNER}
      <Routes>
        <Route path="/" element={<VisitChat />} />
        <Route path="/kb" element={<KnowledgeBase />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
