// SPDX-License-Identifier: Apache-2.0
// HealthFlow Edge — shared TypeScript types
// Mirrors backend Pydantic models

export type WorkflowState =
  | 'INGEST_READY'
  | 'ASR_TRANSCRIBE'
  | 'EXTRACT_STRUCTURED'
  | 'IMAGE_RETRIEVE_SIMILAR_AUTO'
  | 'DRAFT_NOTE'
  | 'BUILD_FHIR'
  | 'GENERATE_PATIENT_SUMMARY'
  | 'QA_CHECKS'
  | 'READY_FOR_REVIEW';

export const WORKFLOW_ORDER: WorkflowState[] = [
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

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stale';

export type ArtifactType =
  | 'note'
  | 'extraction'
  | 'fhir'
  | 'patient_summary'
  | 'tasks'
  | 'similar_cases'
  | 'evidence';

export interface Session {
  id: string;
  clinician_id: string;
  state: WorkflowState;
  is_signed_off: boolean;
  sign_off_at: string | null;
  sign_off_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolCall {
  id: string;
  session_id: string;
  step_name: string;
  status: StepStatus;
  input_hash: string | null;
  output_hash: string | null;
  provider_name: string | null;
  provider_version: string | null;
  started_at: string | null;
  ended_at: string | null;
  latency_ms: number | null;
  error_message: string | null;
}

export interface ProvenanceSpan {
  field_path: string;
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface MedicationEntry {
  name: string;
  dose: string;
  frequency: string;
  route: string;
}

export interface AllergyEntry {
  substance: string;
  reaction: string;
  severity: string;
}

export interface ExtractionContent {
  chief_complaint: string;
  history_of_present_illness: string;
  past_medical_history: string[];
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  review_of_systems: Record<string, string>;
  vital_signs: Record<string, string>;
  physical_exam: Record<string, string>;
  assessment: string;
  plan: string[];
  provenance: ProvenanceSpan[];
}

export interface SOAPNoteContent {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  provenance: ProvenanceSpan[];
  citations: string[];
  version: number;
}

export interface FHIRBundleContent {
  resourceType: string;
  id: string;
  type: string;
  timestamp: string;
  entry: Array<{ resource: Record<string, unknown> }>;
}

export interface TaskItem {
  id: string;
  description: string;
  category: 'missing_info' | 'follow_up' | 'contradiction';
  priority: 'high' | 'medium' | 'low';
  resolved: boolean;
}

export interface QAContent {
  tasks: TaskItem[];
  contradictions: string[];
  missing_fields: string[];
}

export interface PatientSummaryContent {
  summary: string;
  key_points: string[];
  follow_up_instructions: string;
}

export interface SimilarCase {
  case_id: string;
  title: string;
  similarity_score: number;
  modality: string;
  section: string | null;
  citation: string;
}

export interface SimilarCasesContent {
  modality: string;
  cases: SimilarCase[];
  citations: string[];
  derm_cases: SimilarCase[];
  cxr_cases: SimilarCase[];
  primary_collection: string;
}

export interface RAGChunk {
  chunk_id: string;
  doc_id: string;
  doc_title: string;
  page_or_section: string | null;
  text: string;
  score: number;
  citation: string;
}

export interface EvidenceContent {
  query: string;
  chunks: RAGChunk[];
}

export interface Artifact {
  id: string;
  session_id: string;
  artifact_type: ArtifactType;
  version: number;
  content: unknown;
  content_hash: string;
  is_stale: boolean;
  provider_name: string | null;
  provider_version: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  session_id: string;
  event_type: string;
  actor_id: string;
  metadata: Record<string, unknown>;
  event_hash: string;
  created_at: string;
}

export interface RAGDocument {
  id: string;
  title: string;
  filename: string;
  content_hash: string;
  created_at: string;
  chunk_count: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type ChatEvent = UserUploadEvent | ToolCardEvent | SystemMsgEvent;

export interface UserUploadEvent {
  id: string;
  kind: 'user_upload';
  label: string;
  ts: string;
}

export interface ToolCardEvent {
  id: string;
  kind: 'tool_card';
  step: string;
  status: StepStatus;
  provider_name: string | null;
  latency_ms: number | null;
  ts: string;
}

export interface SystemMsgEvent {
  id: string;
  kind: 'system_msg';
  text: string;
  ts: string;
}

// API request types
export interface AgentRunRequest {
  session_id: string;
  step?: WorkflowState;
}

export interface EditNoteRequest {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface SignOffRequest {
  clinician_id: string;
  notes?: string;
}

// SSE event types
export interface AgentSSEEvent {
  event: 'start' | 'completed' | 'error';
  session_id?: string;
  step?: string;
  status?: string;
  tool_call_id?: string;
  message?: string;
  input_hash?: string;
  output_hash?: string;
  provider_name?: string;
  provider_version?: string;
}
