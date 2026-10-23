/**
 * @file storageService.ts
 * @description Manages persistence for CampusCircle using browser localStorage.
 * Loads initial data from seed JSON files on first run, and persists all updates.
 */

import { User } from '../models/user';
import { Club } from '../models/club';
import { CampusEvent } from '../models/event';
import { Registration } from '../models/registration';
import { AppNotification } from '../models/notification';
import { Report } from '../models/report';

import initialUsers from '../data/users.json';
import initialClubs from '../data/clubs.json';
import initialEvents from '../data/events.json';
import initialRegistrations from '../data/registrations.json';
import initialNotifications from '../data/notifications.json';
import initialReports from '../data/reports.json';

const STORAGE_KEYS = {
  USERS: 'campuscircle_users_v1',
  CLUBS: 'campuscircle_clubs_v1',
  EVENTS: 'campuscircle_events_v1',
  REGISTRATIONS: 'campuscircle_registrations_v1',
  NOTIFICATIONS: 'campuscircle_notifications_v1',
  REPORTS: 'campuscircle_reports_v1',
  CURRENT_USER_ID: 'campuscircle_current_user_id_v1'
} as const;

export class StorageService {
  /**
   * Initializes localStorage with default seed JSON data if keys do not already exist.
   */
  public static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, initialUsers as User[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLUBS)) {
      this.set(STORAGE_KEYS.CLUBS, initialClubs as Club[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
      this.set(STORAGE_KEYS.EVENTS, initialEvents as CampusEvent[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) {
      this.set(STORAGE_KEYS.REGISTRATIONS, initialRegistrations as Registration[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, initialNotifications as AppNotification[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      this.set(STORAGE_KEYS.REPORTS, initialReports as Report[]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      // Default active user is Alice Chen (student)
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-student-1');
    }
  }

  // --- Generic Helpers ---
  private static get<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : fallback;
    } catch (e) {
      console.error(`Failed to parse localStorage key: ${key}`, e);
      return fallback;
    }
  }

  private static set<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to write to localStorage key: ${key}`, e);
    }
  }

  // --- Users ---
  public static getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, []);
  }

  public static saveUsers(users: User[]): void {
    this.set(STORAGE_KEYS.USERS, users);
  }

  public static getCurrentUserId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr-student-1';
  }

  public static setCurrentUserId(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  }

  public static getCurrentUser(): User | undefined {
    const currentId = this.getCurrentUserId();
    return this.getUsers().find(u => u.id === currentId);
  }

  // --- Clubs ---
  public static getClubs(): Club[] {
    return this.get<Club[]>(STORAGE_KEYS.CLUBS, []);
  }

  public static saveClubs(clubs: Club[]): void {
    this.set(STORAGE_KEYS.CLUBS, clubs);
  }

  // --- Events ---
  public static getEvents(): CampusEvent[] {
    return this.get<CampusEvent[]>(STORAGE_KEYS.EVENTS, []);
  }

  public static saveEvents(events: CampusEvent[]): void {
    this.set(STORAGE_KEYS.EVENTS, events);
  }

  // --- Registrations ---
  public static getRegistrations(): Registration[] {
    return this.get<Registration[]>(STORAGE_KEYS.REGISTRATIONS, []);
  }

  public static saveRegistrations(registrations: Registration[]): void {
    this.set(STORAGE_KEYS.REGISTRATIONS, registrations);
  }

  // --- Notifications ---
  public static getNotifications(): AppNotification[] {
    return this.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public static saveNotifications(notifications: AppNotification[]): void {
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  // --- Reports ---
  public static getReports(): Report[] {
    return this.get<Report[]>(STORAGE_KEYS.REPORTS, []);
  }

  public static saveReports(reports: Report[]): void {
    this.set(STORAGE_KEYS.REPORTS, reports);
  }

  /**
   * Resets all storage data back to initial seed data. Useful for testing and demos.
   */
  public static resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CLUBS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.init();
  }
}
