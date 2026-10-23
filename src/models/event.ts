/**
 * @file event.ts
 * @description Defines data models for campus events.
 * Matches Event Management module requirements.
 */

export type EventCategory = 'Workshop' | 'Seminar' | 'Competition' | 'Social' | 'Cultural' | 'Sports';
export type EventStatus = 'upcoming' | 'completed' | 'cancelled';

export interface CampusEvent {
  id: string;
  clubId: string;
  clubName: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO date 'YYYY-MM-DD'
  time: string; // e.g. '15:00'
  location: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  imageUrl?: string;
  createdAt: string;
}
