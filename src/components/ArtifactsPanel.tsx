// SPDX-License-Identifier: Apache-2.0
/**
 * ArtifactsPanel — right panel with artifact tabs + timeline log.
 * Tabs: Note | Extraction | FHIR | Summary | QA | Timeline
 * Sign-off lives in a dedicated tab so it doesn't clutter artifact views.
 */
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import type {
  Artifact,
  SOAPNoteContent,
  ExtractionContent,
  PatientSummaryContent,
  QAContent,
  ToolCall,
} from '../types';
import ArtifactEditor from './ArtifactEditor';
import ExportPanel from './ExportPanel';

type Tab = 'note' | 'extraction' | 'fhir' | 'summary' | 'qa' | 'timeline';

interface Props {
  sessionId: string | null;
  refreshTick: number;
}

export default function ArtifactsPanel({ sessionId, refreshTick }: Props) {
  const [tab, setTab] = useState<Tab>('note');
  const [note, setNote] = useState<Artifact | null>(null);
  const [extraction, setExtraction] = useState<Artifact | null>(null);
  const [fhir, setFhir] = useState<Artifact | null>(null);
  const [summary, setSummary] = useState<Artifact | null>(null);
  const [qa, setQa] = useState<Artifact | null>(null);
  const [timeline, setTimeline] = useState<ToolCall[]>([]);
  const [signedOff, setSignedOff] = useState(false);
  const [signingOff, setSigningOff] = useState(false);
  const [signMsg, setSignMsg] = useState('');

  const load = async () => {
    if (!sessionId) return;
    const safe = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try { return await fn(); } catch { return null; }
    };
    const [n, e, f, s, q, tl, sess] = await Promise.all([
      safe(() => api.artifacts.getNote(sessionId)),
      safe(() => api.artifacts.getExtraction(sessionId)),
      safe(() => api.artifacts.getFhir(sessionId)),
      safe(() => api.artifacts.getPatientSummary(sessionId)),
      safe(() => api.artifacts.getTasks(sessionId)),
      safe(() => api.agent.timeline(sessionId)),
      safe(() => api.sessions.get(sessionId)),
    ]);
    setNote(n); setExtraction(e); setFhir(f); setSummary(s); setQa(q);
    if (tl) setTimeline(tl);
    if (sess) setSignedOff(sess.is_signed_off);
  };

  useEffect(() => { load(); }, [sessionId, refreshTick]);

  // Switch to timeline tab when a new step completes
  // (caller bumps refreshTick, we just reload)

  const handleSignOff = async () => {
    if (!sessionId) return;
    setSigningOff(true);
    try {
      await api.artifacts.signOff(sessionId, { clinician_id: 'demo-clinician-1' });
      setSignedOff(true);
      setSignMsg('Signed off — export unlocked.');
      load();
    } catch (e: unknown) {
      setSignMsg(`Error: ${(e as Error).message}`);
    }
    setSigningOff(false);
  };

  if (!sessionId) {
    return (
      <div className="artifacts-panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-sm" style={{ color: 'var(--fg-faint)', padding: '2rem', textAlign: 'center' }}>
          Select a session to view artifacts.
        </p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; dot?: boolean }[] = [
    { key: 'note',       label: 'Note',       dot: !!note },
    { key: 'extraction', label: 'Extraction', dot: !!extraction },
    { key: 'fhir',       label: 'FHIR',       dot: !!fhir },
    { key: 'summary',    label: 'Summary',    dot: !!summary },
    { key: 'qa',         label: 'QA',         dot: !!qa },
    { key: 'timeline',   label: 'Timeline',   dot: timeline.length > 0 },
  ];

  return (
    <div className="artifacts-panel">
      <div className="artifacts-tabs">
        {tabs.map(({ key, label, dot }) => (
          <button
            key={key}
            className={`artifacts-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
            {dot && (
              <span style={{
                display: 'inline-block', width: 5, height: 5,
                borderRadius: '50%', background: 'var(--fg-muted)',
                marginLeft: 4, verticalAlign: 'middle',
              }} />
            )}
          </button>
        ))}
      </div>

      <div className="artifacts-content">
        {tab === 'note' && (
          note
            ? <>
                <ArtifactEditor
                  note={note.content as SOAPNoteContent}
                  sessionId={sessionId}
                  onSaved={load}
                />
                <SignOffSection
                  signedOff={signedOff}
                  signingOff={signingOff}
                  signMsg={signMsg}
                  onSignOff={handleSignOff}
                  sessionId={sessionId}
                />
              </>
            : <Empty label="SOAP note will appear here after the Draft Note step runs." />
        )}

        {tab === 'extraction' && (
          extraction
            ? <ExtractionView content={extraction.content as ExtractionContent} />
            : <Empty label="Structured extraction will appear here after the Extract step runs." />
        )}

        {tab === 'fhir' && (
          fhir
            ? <pre className="code-pane" style={{ fontSize: '0.75rem', maxHeight: '70vh', overflow: 'auto' }}>
                {JSON.stringify(fhir.content, null, 2)}
              </pre>
            : <Empty label="FHIR bundle will appear here after the Build FHIR step runs." />
        )}

        {tab === 'summary' && (
          summary
            ? <SummaryView content={summary.content as PatientSummaryContent} />
            : <Empty label="Patient summary will appear here after the Summary step runs." />
        )}

        {tab === 'qa' && (
          qa
            ? <QAView content={qa.content as QAContent} />
            : <Empty label="QA checks will appear here after the QA step runs." />
        )}

        {tab === 'timeline' && (
          <TimelineView timeline={timeline} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sign-off section — shown only inside the Note tab, below the editor
// ---------------------------------------------------------------------------

function SignOffSection({
  signedOff, signingOff, signMsg, onSignOff, sessionId,
}: {
  signedOff: boolean;
  signingOff: boolean;
  signMsg: string;
  onSignOff: () => void;
  sessionId: string;
}) {
  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
      {signedOff ? (
        <>
          <p className="notice" style={{ marginBottom: '0.75rem', fontSize: '0.8125rem' }}>
            ✓ Signed off — export unlocked.
          </p>
          <ExportPanel sessionId={sessionId} isSigned={true} />
        </>
      ) : (
        <button
          className="btn-secondary btn-sm"
          style={{ width: '100%' }}
          onClick={onSignOff}
          disabled={signingOff}
        >
          {signingOff ? 'Signing off…' : 'Sign off & unlock export'}
        </button>
      )}
      {signMsg && (
        <p className="notice" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{signMsg}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline tab
// ---------------------------------------------------------------------------

const STATUS_PILL: Record<string, string> = {
  completed: 'pill pill-done',
  running:   'pill pill-running',
  failed:    'pill pill-failed',
  pending:   'pill pill-queued',
  stale:     'pill pill-stale',
};

function TimelineView({ timeline }: { timeline: ToolCall[] }) {
  if (timeline.length === 0) {
    return <Empty label="No steps have run yet. Use Run Step to start the workflow." />;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {timeline.map((tc) => (
        <div key={tc.id} style={{
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.6rem 0.75rem',
          background: 'var(--bg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className={STATUS_PILL[tc.status] ?? 'pill pill-queued'}>{tc.status}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
              {tc.step_name}
            </span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '0.1rem 1rem', fontSize: '0.75rem', color: 'var(--fg-muted)',
          }}>
            {tc.provider_name && (
              <span>Provider: <span style={{ fontFamily: 'monospace', color: 'var(--fg)' }}>{tc.provider_name}</span></span>
            )}
            {tc.latency_ms != null && <span>Latency: {tc.latency_ms} ms</span>}
            {tc.input_hash && <span>In: <span style={{ fontFamily: 'monospace' }}>{tc.input_hash.slice(0, 10)}…</span></span>}
            {tc.output_hash && <span>Out: <span style={{ fontFamily: 'monospace' }}>{tc.output_hash.slice(0, 10)}…</span></span>}
            {tc.started_at && <span>Started: {new Date(tc.started_at).toLocaleTimeString()}</span>}
            {tc.ended_at && <span>Ended: {new Date(tc.ended_at).toLocaleTimeString()}</span>}
          </div>
          {tc.error_message && (
            <div style={{
              marginTop: '0.35rem', padding: '0.3rem 0.5rem',
              background: 'var(--bg-muted)', borderRadius: '3px',
              fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--fg)',
            }}>
              {tc.error_message}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Artifact views
// ---------------------------------------------------------------------------

function Empty({ label }: { label: string }) {
  return (
    <p style={{ fontSize: '0.875rem', color: 'var(--fg-faint)', padding: '2rem 0', textAlign: 'center' }}>
      {label}
    </p>
  );
}

function ExtractionView({ content }: { content: ExtractionContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
      <Field label="Chief Complaint" value={content.chief_complaint} />
      <Field label="HPI" value={content.history_of_present_illness} />
      {content.past_medical_history.length > 0 && (
        <Field label="Past Medical History" value={content.past_medical_history.join(', ')} />
      )}
      {content.medications.length > 0 && (
        <div>
          <Label>Medications</Label>
          <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: 'var(--fg)' }}>
            {content.medications.map((m, i) => (
              <li key={i}>{m.name}{m.dose ? ` ${m.dose}` : ''}{m.frequency ? `, ${m.frequency}` : ''}</li>
            ))}
          </ul>
        </div>
      )}
      <Field label="Assessment" value={content.assessment} />
      {content.plan.length > 0 && <Field label="Plan" value={content.plan.join('\n')} />}
    </div>
  );
}

function SummaryView({ content }: { content: PatientSummaryContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
      <p style={{ color: 'var(--fg)', lineHeight: 1.6 }}>{content.summary}</p>
      {content.key_points.length > 0 && (
        <div>
          <Label>Key Points</Label>
          <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: 'var(--fg)' }}>
            {content.key_points.map((kp, i) => <li key={i}>{kp}</li>)}
          </ul>
        </div>
      )}
      {content.follow_up_instructions && (
        <Field label="Follow-up" value={content.follow_up_instructions} />
      )}
    </div>
  );
}

function QAView({ content }: { content: QAContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
      {content.tasks.length > 0 && (
        <div>
          <Label>Tasks</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
            {content.tasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span className={`pill pill-${t.priority}`} style={{ flexShrink: 0 }}>{t.priority}</span>
                <span style={{ color: 'var(--fg)' }}>{t.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.contradictions.length > 0 && (
        <div>
          <Label>Contradictions</Label>
          <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: 'var(--fg)' }}>
            {content.contradictions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
      {content.missing_fields.length > 0 && (
        <div>
          <Label>Missing Fields</Label>
          <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0, color: 'var(--fg)' }}>
            {content.missing_fields.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-muted)', marginBottom: '0.15rem' }}>
      {children}
    </p>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <p style={{ color: 'var(--fg)', whiteSpace: 'pre-wrap', margin: 0 }}>{value || '—'}</p>
    </div>
  );
}
