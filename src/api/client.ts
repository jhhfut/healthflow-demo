// SPDX-License-Identifier: Apache-2.0
/**
 * Mock API client for HealthFlow static demo (GitHub Pages).
 * No backend required — all data is simulated in-browser with localStorage state.
 *
 * Demo patient: Sarah Mitchell, 52F, cardiology follow-up.
 */

import type {
  Artifact,
  AuditEvent,
  EditNoteRequest,
  EvidenceContent,
  RAGDocument,
  Session,
  SignOffRequest,
  ToolCall,
  ValidationResult,
  WorkflowState,
} from '../types';

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

const DEMO_SESSION_ID = 'demo-session-001';

const WORKFLOW_STATES: WorkflowState[] = [
  'INGEST_READY',
  'ASR_TRANSCRIBE',
  'EXTRACT_STRUCTURED',
  'IMAGE_RETRIEVE_SIMILAR_AUTO',
  'DRAFT_NOTE',
  'BUILD_FHIR',
  'GENERATE_PATIENT_SUMMARY',
  'QA_CHECKS',
  'READY_FOR_REVIEW',
];

interface DemoState {
  stateIndex: number;
  signed: boolean;
  noteContent: string;
  timeline: ToolCall[];
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem('hf-demo-state');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { stateIndex: 0, signed: false, noteContent: DEMO_NOTE_CONTENT, timeline: [] };
}

function saveState(s: DemoState) {
  localStorage.setItem('hf-demo-state', JSON.stringify(s));
}

function currentSession(): Session {
  const s = loadState();
  return {
    id: DEMO_SESSION_ID,
    clinician_id: 'demo-clinician-1',
    state: WORKFLOW_STATES[s.stateIndex],
    created_at: '2025-06-12T09:14:00Z',
    updated_at: new Date().toISOString(),
    signed_off: s.signed,
    signed_off_at: s.signed ? '2025-06-12T10:30:00Z' : null,
    signed_off_by: s.signed ? 'demo-clinician-1' : null,
  } as unknown as Session;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Demo clinical data — Sarah Mitchell, 52F, cardiology follow-up
// ---------------------------------------------------------------------------

const DEMO_NOTE_CONTENT = `SUBJECTIVE
Patient: Sarah Mitchell, 52F. Presents with 3-week history of intermittent chest tightness,
occurring primarily with exertion (walking up stairs, brisk walking). Episodes last 2-5 minutes
and resolve with rest. Denies radiation to arm or jaw, diaphoresis, or syncope. Reports mild
dyspnea on exertion. Current medications: Atorvastatin 40 mg daily, Metoprolol succinate 50 mg daily.
Allergy: Penicillin (urticarial rash).

OBJECTIVE
BP 138/84 mmHg, HR 72 bpm (regular), Temp 36.8°C, SpO2 97% on RA, RR 14/min.
General: well-appearing, no acute distress. Cardiovascular: regular rate and rhythm, no murmurs,
rubs, or gallops. Lungs: clear to auscultation bilaterally. Extremities: no peripheral edema.
ECG at rest: normal sinus rhythm, no ST changes.

ASSESSMENT
1. Stable angina pectoris — new onset, exertional pattern.
2. Hypertension — suboptimally controlled (138/84).
3. Hyperlipidaemia — on statin therapy, LDL last checked 6 months ago.

PLAN
1. Increase Metoprolol succinate to 100 mg daily.
2. Order exercise stress test (treadmill ECG) within 2 weeks.
3. Repeat fasting lipid panel.
4. Add sublingual nitroglycerin 0.4 mg PRN for acute episodes — patient counselled on use.
5. Follow-up in 4 weeks or sooner if symptoms worsen.
6. Refer to cardiology if stress test positive or symptoms escalate.`;

const DEMO_EXTRACTION = {
  chief_complaint: 'Intermittent chest tightness for 3 weeks',
  history_of_present_illness:
    'Exertional chest tightness occurring with stair climbing and brisk walking. Episodes last 2-5 minutes, resolve with rest. No radiation, no diaphoresis, no syncope.',
  past_medical_history: ['Hypertension', 'Hyperlipidaemia'],
  medications: [
    { name: 'Atorvastatin', dose: '40 mg', frequency: 'daily', route: 'oral' },
    { name: 'Metoprolol succinate', dose: '50 mg', frequency: 'daily', route: 'oral' },
  ],
  allergies: [{ substance: 'Penicillin', reaction: 'urticarial rash', severity: 'moderate' }],
  review_of_systems: {
    cardiovascular: 'Chest tightness, mild dyspnea on exertion',
    respiratory: 'Dyspnea on exertion only',
    neurological: 'No syncope, no headache',
  },
  vital_signs: {
    blood_pressure: '138/84 mmHg',
    heart_rate: '72 bpm',
    temperature: '36.8°C',
    oxygen_saturation: '97%',
    respiratory_rate: '14/min',
  },
  physical_exam: {
    cardiovascular: 'Regular rate and rhythm, no murmurs, rubs, or gallops',
    respiratory: 'Clear to auscultation bilaterally',
    extremities: 'No peripheral edema',
  },
  assessment: 'Stable angina pectoris, hypertension (suboptimal control), hyperlipidaemia',
  plan: [
    'Increase Metoprolol succinate to 100 mg daily',
    'Exercise stress test within 2 weeks',
    'Repeat fasting lipid panel',
    'Add sublingual nitroglycerin 0.4 mg PRN',
    'Follow-up in 4 weeks',
    'Cardiology referral if stress test positive',
  ],
  provenance: [
    { field: 'chief_complaint', start: 42, end: 91 },
    { field: 'medications[0]', start: 320, end: 348 },
    { field: 'medications[1]', start: 349, end: 390 },
    { field: 'allergies[0]', start: 392, end: 429 },
  ],
};

const DEMO_FHIR = {
  resourceType: 'Bundle',
  id: 'bundle-sarah-mitchell-2025',
  type: 'document',
  timestamp: '2025-06-12T09:14:00Z',
  entry: [
    {
      resource: {
        resourceType: 'Patient',
        id: 'patient-sarah-mitchell',
        name: [{ use: 'official', family: 'Mitchell', given: ['Sarah'] }],
        gender: 'female',
        birthDate: '1973-03-08',
      },
    },
    {
      resource: {
        resourceType: 'Condition',
        id: 'condition-angina',
        clinicalStatus: { coding: [{ code: 'active' }] },
        code: {
          coding: [{ system: 'http://snomed.info/sct', code: '194828000', display: 'Angina pectoris' }],
        },
        subject: { reference: 'Patient/patient-sarah-mitchell' },
      },
    },
    {
      resource: {
        resourceType: 'MedicationStatement',
        id: 'med-atorvastatin',
        status: 'active',
        medicationCodeableConcept: { text: 'Atorvastatin 40 mg' },
        subject: { reference: 'Patient/patient-sarah-mitchell' },
        dosage: [{ text: '40 mg daily orally' }],
      },
    },
    {
      resource: {
        resourceType: 'MedicationStatement',
        id: 'med-metoprolol',
        status: 'active',
        medicationCodeableConcept: { text: 'Metoprolol succinate 50 mg' },
        subject: { reference: 'Patient/patient-sarah-mitchell' },
        dosage: [{ text: '50 mg daily orally' }],
      },
    },
    {
      resource: {
        resourceType: 'AllergyIntolerance',
        id: 'allergy-penicillin',
        clinicalStatus: { coding: [{ code: 'active' }] },
        code: { coding: [{ display: 'Penicillin' }] },
        reaction: [{ description: 'Urticarial rash', severity: 'moderate' }],
        patient: { reference: 'Patient/patient-sarah-mitchell' },
      },
    },
  ],
};

const DEMO_PATIENT_SUMMARY = {
  summary:
    'You were seen today for chest tightness that occurs when you exert yourself, such as climbing stairs. Your doctor believes this is stable angina — a common condition where the heart muscle does not get quite enough blood during activity.',
  key_points: [
    'Your chest tightness during exercise is called stable angina.',
    'Your blood pressure was slightly elevated at 138/84 — continue monitoring.',
    'Your cholesterol medication (Atorvastatin) continues; a blood test has been ordered.',
    'Your Metoprolol dose has been increased to help reduce episodes.',
    'A treadmill stress test has been ordered for the next 2 weeks.',
    'Use the new nitroglycerin spray under your tongue if you get chest tightness.',
  ],
  follow_up_instructions:
    'Return in 4 weeks, or sooner if chest tightness becomes more frequent, happens at rest, or does not improve with nitroglycerin. Call emergency services immediately if pain is severe or lasts more than 20 minutes.',
};

const DEMO_TASKS = {
  tasks: [
    { id: 'task-001', description: 'LDL value not recorded — repeat fasting lipid panel ordered', category: 'missing_data', priority: 'medium', resolved: false },
    { id: 'task-002', description: 'Confirm nitroglycerin counselling documented in chart', category: 'documentation', priority: 'low', resolved: false },
    { id: 'task-003', description: 'Stress test referral — confirm order placed in EHR', category: 'follow_up', priority: 'high', resolved: false },
  ],
  contradictions: [],
  missing_fields: ['LDL result', 'Weight / BMI', 'Smoking status'],
};

const DEMO_SIMILAR_CASES = {
  primary_collection: 'none',
  derm_cases: [],
  cxr_cases: [],
  cases: [],
  citations: [],
};

const DEMO_RAG_DOCS: RAGDocument[] = [
  { id: 'rag-001', title: 'ACC/AHA Stable Ischemic Heart Disease Guidelines 2023', chunk_count: 24, created_at: '2025-05-10T08:00:00Z' } as unknown as RAGDocument,
  { id: 'rag-002', title: 'ESC Guidelines on Chronic Coronary Syndromes', chunk_count: 31, created_at: '2025-05-10T08:05:00Z' } as unknown as RAGDocument,
];

const DEMO_AUDIT_BASE: AuditEvent[] = [
  { id: 'a1', session_id: DEMO_SESSION_ID, event_type: 'session_created', actor: 'demo-clinician-1', ts: '2025-06-12T09:14:00Z', payload_hash: 'abc123' } as unknown as AuditEvent,
  { id: 'a2', session_id: DEMO_SESSION_ID, event_type: 'ingest_text', actor: 'demo-clinician-1', ts: '2025-06-12T09:15:12Z', payload_hash: 'def456' } as unknown as AuditEvent,
];

const STEP_PROVIDERS: Partial<Record<WorkflowState, string>> = {
  ASR_TRANSCRIBE: 'MedASR',
  EXTRACT_STRUCTURED: 'MedGemma',
  IMAGE_RETRIEVE_SIMILAR_AUTO: 'LocalFaissIndex',
  DRAFT_NOTE: 'MedGemma',
  BUILD_FHIR: 'MedGemma',
  GENERATE_PATIENT_SUMMARY: 'MedGemma',
  QA_CHECKS: 'MedGemma',
};

const STEP_LATENCIES: Partial<Record<WorkflowState, number>> = {
  ASR_TRANSCRIBE: 1800,
  EXTRACT_STRUCTURED: 2200,
  IMAGE_RETRIEVE_SIMILAR_AUTO: 400,
  DRAFT_NOTE: 2600,
  BUILD_FHIR: 1900,
  GENERATE_PATIENT_SUMMARY: 1500,
  QA_CHECKS: 1100,
  READY_FOR_REVIEW: 100,
};

function makeArtifact(type: string, content: unknown, version = 1): Artifact {
  const s = loadState();
  return {
    id: `artifact-${type}`,
    session_id: DEMO_SESSION_ID,
    artifact_type: type,
    version,
    content,
    stale: false,
    created_at: '2025-06-12T09:20:00Z',
    updated_at: new Date().toISOString(),
    signed_off: s.signed,
  } as unknown as Artifact;
}

// ---------------------------------------------------------------------------
// Public API (same interface as real client.ts)
// ---------------------------------------------------------------------------

export const api = {
  sessions: {
    create: async (): Promise<Session> => {
      const s = loadState();
      s.stateIndex = 0;
      s.signed = false;
      s.noteContent = DEMO_NOTE_CONTENT;
      s.timeline = [];
      saveState(s);
      await sleep(300);
      return currentSession();
    },

    get: async (_id: string): Promise<Session> => {
      await sleep(100);
      return currentSession();
    },

    list: async (): Promise<Session[]> => {
      await sleep(200);
      return [currentSession()];
    },

    delete: async (_id: string): Promise<void> => {
      localStorage.removeItem('hf-demo-state');
      await sleep(200);
    },
  },

  ingest: {
    audio: async (_session_id: string, _file: File) => {
      await sleep(600);
      return { file_id: 'demo-audio-001', content_hash: 'sha256-demo' };
    },
    text: async (_session_id: string, _text: string) => {
      await sleep(300);
      return { file_id: 'demo-text-001', content_hash: 'sha256-demo' };
    },
    image: async (_session_id: string, _file: File) => {
      await sleep(500);
      return { file_id: 'demo-image-001', content_hash: 'sha256-demo' };
    },
  },

  agent: {
    timeline: async (_session_id: string): Promise<ToolCall[]> => {
      await sleep(150);
      return loadState().timeline;
    },

    runStream: (_session_id: string, _step?: WorkflowState): EventSource => {
      throw new Error('Use runAsync instead');
    },

    runAsync: async (
      _session_id: string,
      _step?: WorkflowState,
      onEvent?: (evt: Record<string, unknown>) => void
    ): Promise<void> => {
      const s = loadState();
      const currentState = WORKFLOW_STATES[s.stateIndex];

      if (currentState === 'READY_FOR_REVIEW') {
        onEvent?.({ event: 'error', message: 'Already at READY_FOR_REVIEW' });
        return;
      }

      onEvent?.({ event: 'start', step: currentState });

      const latency = STEP_LATENCIES[currentState as WorkflowState] ?? 1200;
      await sleep(latency);

      const nextIndex = Math.min(s.stateIndex + 1, WORKFLOW_STATES.length - 1);
      const toolCall: ToolCall = {
        id: `tc-${currentState}-${Date.now()}`,
        session_id: DEMO_SESSION_ID,
        step: currentState as WorkflowState,
        provider_name: STEP_PROVIDERS[currentState as WorkflowState] ?? 'HealthFlow',
        latency_ms: latency,
        status: 'completed',
        created_at: new Date().toISOString(),
      } as unknown as ToolCall;

      s.stateIndex = nextIndex;
      s.timeline = [...s.timeline, toolCall];
      saveState(s);

      onEvent?.({
        event: 'completed',
        step: currentState,
        provider_name: toolCall.provider_name,
        latency_ms: latency,
      });
    },
  },

  artifacts: {
    getNote: async (_session_id: string): Promise<Artifact> => {
      await sleep(150);
      const s = loadState();
      return makeArtifact('note', {
        subjective: 'Sarah Mitchell, 52F. Intermittent chest tightness for 3 weeks, exertional.',
        objective: 'BP 138/84, HR 72, SpO2 97%. Regular rhythm, no murmurs. ECG: NSR.',
        assessment: 'Stable angina pectoris. Hypertension (suboptimal). Hyperlipidaemia.',
        plan: s.noteContent,
        citations: [],
        provenance: DEMO_EXTRACTION.provenance,
      });
    },

    getExtraction: async (_session_id: string): Promise<Artifact> => {
      await sleep(150);
      return makeArtifact('extraction', DEMO_EXTRACTION);
    },

    getFhir: async (_session_id: string): Promise<Artifact> => {
      await sleep(150);
      return makeArtifact('fhir', DEMO_FHIR);
    },

    getPatientSummary: async (_session_id: string): Promise<Artifact> => {
      await sleep(150);
      return makeArtifact('patient_summary', DEMO_PATIENT_SUMMARY);
    },

    getTasks: async (_session_id: string): Promise<Artifact> => {
      await sleep(150);
      return makeArtifact('tasks', DEMO_TASKS);
    },

    getSimilarCases: async (_session_id: string): Promise<Artifact> => {
      await sleep(150);
      return makeArtifact('similar_cases', DEMO_SIMILAR_CASES);
    },

    editNote: async (_session_id: string, body: EditNoteRequest): Promise<Artifact> => {
      await sleep(300);
      const s = loadState();
      s.noteContent = (body as { content?: string }).content ?? s.noteContent;
      saveState(s);
      return makeArtifact('note', {
        subjective: 'Sarah Mitchell, 52F. Intermittent chest tightness for 3 weeks, exertional.',
        objective: 'BP 138/84, HR 72, SpO2 97%. Regular rhythm, no murmurs.',
        assessment: 'Stable angina pectoris. Hypertension. Hyperlipidaemia.',
        plan: s.noteContent,
        citations: [],
        provenance: DEMO_EXTRACTION.provenance,
      }, 2);
    },

    signOff: async (_session_id: string, _body: SignOffRequest): Promise<Session> => {
      await sleep(400);
      const s = loadState();
      s.signed = true;
      saveState(s);
      return currentSession();
    },
  },

  export: {
    note: async (_session_id: string) => {
      await sleep(400);
      if (!loadState().signed) throw new Error('API 403: Sign off required before export');
      return { message: 'Note exported successfully', path: 'exports/note_mitchell_2025-06-12.txt' };
    },

    fhir: async (_session_id: string) => {
      await sleep(500);
      if (!loadState().signed) throw new Error('API 403: Sign off required before export');
      return { message: 'FHIR bundle exported', path: 'exports/fhir_mitchell_2025-06-12.json' };
    },

    validateFhir: async (_session_id: string): Promise<ValidationResult> => {
      await sleep(600);
      return {
        valid: true,
        errors: [],
        warnings: ['Patient.birthDate format valid but no identifier provided'],
        resource_count: 5,
      } as unknown as ValidationResult;
    },
  },

  audit: {
    list: async (_session_id: string): Promise<AuditEvent[]> => {
      await sleep(150);
      const s = loadState();
      const events = [...DEMO_AUDIT_BASE];
      for (const tc of s.timeline) {
        events.push({
          id: `audit-${tc.id}`,
          session_id: DEMO_SESSION_ID,
          event_type: `step_${(tc as unknown as { step: string }).step}`,
          actor: 'system',
          ts: (tc as unknown as { created_at: string }).created_at,
          payload_hash: 'demo-hash',
        } as unknown as AuditEvent);
      }
      if (s.signed) {
        events.push({
          id: 'audit-signoff',
          session_id: DEMO_SESSION_ID,
          event_type: 'sign_off',
          actor: 'demo-clinician-1',
          ts: '2025-06-12T10:30:00Z',
          payload_hash: 'signoff-hash',
        } as unknown as AuditEvent);
      }
      return events;
    },
  },

  rag: {
    listDocuments: async (): Promise<RAGDocument[]> => {
      await sleep(200);
      return DEMO_RAG_DOCS;
    },

    uploadDocument: async (title: string, _file: File) => {
      await sleep(800);
      return { id: `rag-${Date.now()}`, title, chunk_count: 12, created_at: new Date().toISOString() };
    },

    search: async (query: string, _k = 5): Promise<EvidenceContent> => {
      await sleep(400);
      return {
        results: [
          {
            doc_id: 'rag-001',
            title: 'ACC/AHA Stable Ischemic Heart Disease Guidelines 2023',
            chunk: 'Beta-blockers are recommended as first-line anti-anginal therapy (Class I, Level A). Target resting HR 55-60 bpm.',
            score: 0.91,
            citation: '[ACC/AHA 2023, Section 4.2]',
          },
          {
            doc_id: 'rag-002',
            title: 'ESC Guidelines on Chronic Coronary Syndromes',
            chunk: 'Exercise stress testing is first-line for diagnosis of obstructive CAD in patients with stable chest pain and intermediate pre-test probability.',
            score: 0.87,
            citation: '[ESC CCS 2024, Recommendation 3a]',
          },
        ],
        query,
      } as unknown as EvidenceContent;
    },
  },

  imaging: {
    retrieve: async (_session_id: string, _modality: 'derm' | 'cxr', _file: File) => {
      await sleep(700);
      return { cases: [], primary_collection: 'none', citations: [] };
    },
  },
};
