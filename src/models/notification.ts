/**
 * @file notification.ts
 * @description Defines data models for user notifications.
 * Matches Notification Service requirements.
 */

export type NotificationType = 'registration' | 'cancellation' | 'club' | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string; // ISO timestamp
}
