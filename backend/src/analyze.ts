import OpenAI from "openai";
import { z } from "zod";
import { config } from "./config.js";
import { COACH_SYSTEM_PROMPT } from "./coachPrompt.js";
import { AnalysisOutput, UploadNotification } from "./types.js";

const analysisSchema = z.object({
  call_id: z.string(),
  agent_id: z.string(),
  customer_id: z.string().optional(),
  summary_short: z.string(),
  tab1_general_summary: z.string(),
  tab2_personal_analysis: z.string(),
  tab3_recommendations: z.string(),
  confidence: z.number().min(0).max(1)
});

const openai = new OpenAI({ apiKey: config.openAiApiKey });

function buildDocumentMarkdown(
  tab1: string,
  tab2: string,
  tab3: string
): string {
  return [
    "# טאב 1 — סיכום כללי",
    "",
    tab1.trim(),
    "",
    "---",
    "",
    "# טאב 2 — הניתוח האישי (מאמן מכירות)",
    "",
    tab2.trim(),
    "",
    "---",
    "",
    "# טאב 3 — המלצות",
    "",
    tab3.trim()
  ].join("\n");
}

export async function analyzeTranscript(
  transcript: string,
  upload: UploadNotification
): Promise<AnalysisOutput> {
  const userPrompt = JSON.stringify(
    {
      call_id: upload.callId,
      agent_id: upload.agentId,
      customer_id: upload.customerId,
      duration_sec: upload.durationSec,
      transcript
    },
    null,
    2
  );

  const response = await openai.responses.create({
    model: config.openAiModel,
    input: [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "call_coach_analysis",
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "call_id",
            "agent_id",
            "summary_short",
            "tab1_general_summary",
            "tab2_personal_analysis",
            "tab3_recommendations",
            "confidence"
          ],
          properties: {
            call_id: { type: "string" },
            agent_id: { type: "string" },
            customer_id: { type: "string" },
            summary_short: {
              type: "string",
              description: "One or two sentences for CRM list view"
            },
            tab1_general_summary: {
              type: "string",
              description: "Tab 1: full call summary with quotes only from transcript"
            },
            tab2_personal_analysis: {
              type: "string",
              description: "Tab 2: coach analysis — psychology, persuasion, gaps, current vs desired"
            },
            tab3_recommendations: {
              type: "string",
              description: "Tab 3: strengths to keep, improvements, quotes, alternative phrasing for future calls"
            },
            confidence: { type: "number", minimum: 0, maximum: 1 }
          }
        }
      }
    }
  });

  const payload = response.output_text;
  if (!payload) {
    throw new Error("Model returned empty analysis payload");
  }

  const parsed = JSON.parse(payload) as z.infer<typeof analysisSchema>;
  const validated = analysisSchema.parse(parsed);

  return {
    call_id: validated.call_id,
    agent_id: validated.agent_id,
    customer_id: validated.customer_id,
    summary_short: validated.summary_short,
    tab1_general_summary: validated.tab1_general_summary,
    tab2_personal_analysis: validated.tab2_personal_analysis,
    tab3_recommendations: validated.tab3_recommendations,
    document_markdown: buildDocumentMarkdown(
      validated.tab1_general_summary,
      validated.tab2_personal_analysis,
      validated.tab3_recommendations
    ),
    confidence: validated.confidence
  };
}
