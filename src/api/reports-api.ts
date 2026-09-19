import type { KyInstance } from "ky";

import { unwrap } from "./http-client";

export type ReportTargetType = "POST" | "MESSAGE" | "USER";

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE"
  | "SEXUAL"
  | "VIOLENCE"
  | "SELF_HARM"
  | "IMPERSONATION"
  | "OTHER";

export type ReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
};

export const reportsApi = {
  report: (client: KyInstance, input: ReportInput) => unwrap<void>(client.post("reports", { json: input })),
};
