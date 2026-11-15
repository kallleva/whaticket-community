export const LEAD_STATUSES = ["hot", "warm", "cold", "won", "lost"] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

export const PIPELINE_STAGES = [
  "lead",
  "contacted",
  "negotiating",
  "proposal",
  "won",
  "lost"
] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];
