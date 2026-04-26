export type JobStatus =
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "analyzing"
  | "delivering"
  | "completed"
  | "failed";

export interface UploadNotification {
  callId: string;
  agentId: string;
  customerId?: string;
  recordingPath: string;
  durationSec?: number;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface AnalysisOutput {
  call_id: string;
  agent_id: string;
  customer_id?: string | null;
  /** שורה אחת לתצוגה ברשימות ב-CRM */
  summary_short: string;
  /** טאב 1 — סיכום כללי מלא, עם ציטוטים רק מהטרנסקריפט */
  tab1_general_summary: string;
  /** טאב 2 — ניתוח מאמן מכירות (חוזקות, פסיכולוגיה, משא ומתן וכו') */
  tab2_personal_analysis: string;
  /** טאב 3 — המלצות לשיפור עם ציטוטים ודוגמאות חלופיות */
  tab3_recommendations: string;
  /** מסמך מאוחד (Markdown) מוכן להעתקה ל-Google Docs */
  document_markdown: string;
  /** ביטחון בניתוח בהתבסס על איכות/שלמות הטרנסקריפט (0–1) */
  confidence: number;
}

export interface JobRecord {
  callId: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  idempotencyKey: string;
  upload: UploadNotification;
  transcript?: string;
  analysis?: AnalysisOutput;
  lastError?: string;
}
