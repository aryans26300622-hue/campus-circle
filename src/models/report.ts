/**
 * @file report.ts
 * @description Defines data models for moderation reports on events or clubs.
 * Matches Platform Admin oversight requirements.
 */

export type ReportTargetType = 'event' | 'club';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: string;
  status: ReportStatus;
  createdAt: string; // ISO timestamp
  resolutionNotes?: string;
}
