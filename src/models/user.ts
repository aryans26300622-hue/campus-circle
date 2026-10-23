/**
 * @file user.ts
 * @description Defines data models and types for CampusCircle users and roles.
 * Supports Student, Club Admin, and Platform Admin roles.
 */

export type UserRole = 'student' | 'club_admin' | 'platform_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId?: string; // If club_admin, identifies which club they manage
  joinedClubIds: string[]; // List of club IDs the student has joined
}
