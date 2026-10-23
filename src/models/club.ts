/**
 * @file club.ts
 * @description Defines data models for student clubs and organizations.
 * Matches Club Discovery and Club Management module requirements.
 */

export type ClubStatus = 'approved' | 'pending' | 'rejected';

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., 'Technology', 'Arts & Culture', 'Sports', 'Academic', 'Social Impact'
  leadId: string; // User ID of the club admin/leader
  leadName: string;
  memberCount: number;
  status: ClubStatus;
  contactEmail: string;
  imageUrl?: string;
  createdAt: string;
}
