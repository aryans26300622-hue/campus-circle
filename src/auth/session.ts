/**
 * @file session.ts
 * @description Manages user session and role switching in CampusCircle.
 * Supports switching between Student, Club Admin, and Platform Admin personas.
 */

import { User } from '../models/user';
import { StorageService } from '../storage/storageService';

type SessionListener = (user: User) => void;

export class SessionService {
  private static listeners: SessionListener[] = [];

  /**
   * Returns the currently active user from StorageService.
   */
  public static getCurrentUser(): User {
    const user = StorageService.getCurrentUser();
    if (user) return user;

    // Fallback: Return first user in storage or default student
    const all = StorageService.getUsers();
    return all[0] || {
      id: 'usr-student-1',
      name: 'Alice Chen',
      email: 'alice.chen@campus.edu',
      role: 'student',
      joinedClubIds: []
    };
  }

  /**
   * Switches the active user, persists it, and notifies subscribers.
   */
  public static setCurrentUser(userId: string): void {
    StorageService.setCurrentUserId(userId);
    const user = this.getCurrentUser();
    this.notify(user);
  }

  /**
   * Subscribes to role/user changes to re-render relevant views.
   */
  public static subscribe(listener: SessionListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify(user: User): void {
    this.listeners.forEach(listener => listener(user));
  }

  /**
   * Initializes the header role selector dropdown with all available personas.
   */
  public static initRoleSwitcher(selectElementId: string): void {
    const select = document.getElementById(selectElementId) as HTMLSelectElement | null;
    if (!select) return;

    const users = StorageService.getUsers();
    const currentUser = this.getCurrentUser();

    select.innerHTML = '';
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      // Friendly role label
      const roleLabel =
        user.role === 'student'
          ? 'Student'
          : user.role === 'club_admin'
          ? 'Club Admin'
          : 'Platform Admin';

      option.textContent = `${user.name} (${roleLabel})`;
      if (user.id === currentUser.id) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      this.setCurrentUser(select.value);
    });
  }
}
