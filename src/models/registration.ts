/**
 * @file registration.ts
 * @description Defines data models for student event registrations.
 * Direct implementation of the CampusCircle Registration & Attendance LLD.
 */

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED';

export interface Registration {
  registrationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  eventId: string;
  status: RegistrationStatus;
  registeredAt: string; // ISO timestamp
  cancelledAt?: string; // Set when cancelled
}
