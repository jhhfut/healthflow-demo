// SPDX-License-Identifier: Apache-2.0
/**
 * ExportPanel — used in ReviewSignoff.
 * Monochrome: locked state shown in gray, primary / secondary buttons only.
 */
import React, { useState } from 'react';
import { api } from '../api/client';
import type { ValidationResult } from '../types';

interface Props {
  sessionId: string;
  isSigned: boolean;
}

export default function ExportPanel({ sessionId, isSigned }: Props) {
  const [adapter, setAdapter] = useState<'file' | 'mock_ehr'>('file');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [status, setStatus] = useState('');

  const validate = async () => {
    try {
      const v = await api.export.validateFhir(sessionId);
      setValidation(v);
    } catch (e: unknown) {
      setStatus(`Validation error: ${(e as Error).message}`);
    }
  };

  const exportNote = async () => {
    try {
      const r = await api.export.note(sessionId);
      setStatus(`Note exported: ${r.path}`);
    } catch (e: unknown) {
      setStatus(`Export failed: ${(e as Error).message}`);
    }
  };

  const exportFhir = async () => {
    try {
      const r = await api.export.fhir(sessionId);
      setStatus(`FHIR exported: ${r.path}`);
    } catch (e: unknown) {
      setStatus(`Export failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Lock notice */}
      {!isSigned && (
        <div className="notice notice-locked text-xs">
          Export locked — clinician sign-off required.
        </div>
      )}

      {/* Adapter selector */}
      <div className="flex gap-2 items-center text-sm">
        <label className="text-gray-600 text-xs whitespace-nowrap">Adapter:</label>
        <select
          className="!w-auto text-xs"
          value={adapter}
          onChange={(e) => setAdapter(e.target.value as 'file' | 'mock_ehr')}
        >
          <option value="file">File export (local)</option>
          <option value="mock_ehr">Mock EHR (simulate push)</option>
        </select>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button className="btn-secondary btn-sm" onClick={validate}>
          Dry-run Validate FHIR
        </button>
        <button
          className="btn-primary btn-sm"
          onClick={exportNote}
          disabled={!isSigned}
        >
          Export Note
        </button>
        <button
          className="btn-primary btn-sm"
          onClick={exportFhir}
          disabled={!isSigned}
        >
          Export FHIR
        </button>
      </div>

      {/* Validation result */}
      {validation && (
        <div className="border border-gray-300 rounded p-2 text-xs text-gray-700 bg-gray-50">
          {validation.valid
            ? '✓ FHIR bundle is valid'
            : (
              <>
                <span className="font-semibold">Validation errors:</span>
                {validation.errors.map((e, i) => (
                  <p key={i} className="mt-0.5">• {e}</p>
                ))}
              </>
            )}
        </div>
      )}

      {/* Status feedback */}
      {status && (
        <div className="notice text-xs">{status}</div>
      )}
    </div>
  );
}
