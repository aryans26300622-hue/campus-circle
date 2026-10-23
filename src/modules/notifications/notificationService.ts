/**
 * @file notificationService.ts
 * @description Implements the CampusCircle Notification Service.
 * Manages user alert dispatches, badge counts, and the interactive notifications dropdown.
 */

import { AppNotification } from '../../models/notification';
import { StorageService } from '../../storage/storageService';
import { SessionService } from '../../auth/session';

export class NotificationServiceModule {
  private static isDropdownOpen: boolean = false;

  /**
   * Returns all notifications addressed to the current active user.
   */
  public static getUserNotifications(): AppNotification[] {
    const currentUser = SessionService.getCurrentUser();
    return StorageService.getNotifications().filter(n => n.userId === currentUser.id);
  }

  /**
   * Returns the count of unread notifications for the active user.
   */
  public static getUnreadCount(): number {
    return this.getUserNotifications().filter(n => !n.read).length;
  }

  /**
   * Marks a specific notification as read.
   */
  public static markAsRead(notificationId: string): void {
    const notifications = StorageService.getNotifications();
    const notif = notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
      StorageService.saveNotifications(notifications);
      this.updateUI();
    }
  }

  /**
   * Marks all notifications for the current user as read.
   */
  public static markAllAsRead(): void {
    const currentUser = SessionService.getCurrentUser();
    const notifications = StorageService.getNotifications();
    notifications.forEach(n => {
      if (n.userId === currentUser.id) {
        n.read = true;
      }
    });
    StorageService.saveNotifications(notifications);
    this.updateUI();
  }

  /**
   * Clears (deletes) all notifications for the current user.
   */
  public static clearAll(): void {
    const currentUser = SessionService.getCurrentUser();
    let notifications = StorageService.getNotifications();
    notifications = notifications.filter(n => n.userId !== currentUser.id);
    StorageService.saveNotifications(notifications);
    this.updateUI();
  }

  /**
   * Initializes the bell toggle button and click-outside dismissal.
   */
  public static init(): void {
    const bellBtn = document.getElementById('notif-bell-btn');
    const dropdown = document.getElementById('notif-dropdown');

    bellBtn?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown on outside click
    document.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (
        this.isDropdownOpen &&
        !dropdown?.contains(target) &&
        !bellBtn?.contains(target)
      ) {
        this.closeDropdown();
      }
    });

    this.updateUI();
  }

  public static toggleDropdown(): void {
    if (this.isDropdownOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  public static openDropdown(): void {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;

    this.isDropdownOpen = true;
    dropdown.classList.remove('hidden');
    this.renderDropdownContent();
  }

  public static closeDropdown(): void {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;

    this.isDropdownOpen = false;
    dropdown.classList.add('hidden');
  }

  /**
   * Updates bell badge and re-renders dropdown if open.
   */
  public static updateUI(): void {
    const badge = document.getElementById('notif-badge');
    const unreadCount = this.getUnreadCount();

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount.toString();
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (this.isDropdownOpen) {
      this.renderDropdownContent();
    }
  }

  private static renderDropdownContent(): void {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;

    const notifs = this.getUserNotifications();
    const unreadCount = this.getUnreadCount();

    dropdown.innerHTML = `
      <div class="notif-dropdown-header">
        <div class="notif-title-wrap">
          <h4>Notifications</h4>
          ${unreadCount > 0 ? `<span class="badge badge-primary-subtle">${unreadCount} new</span>` : ''}
        </div>
        ${
          unreadCount > 0
            ? `<button class="btn-text-action" id="btn-mark-all-read">Mark all as read</button>`
            : ''
        }
      </div>

      <div class="notif-dropdown-list">
        ${
          notifs.length === 0
            ? `
            <div class="empty-notifs">
              <span style="font-size: 1.8rem;">🔔</span>
              <p>No notifications yet</p>
              <small style="color: var(--text-light);">Updates regarding your event registrations and club alerts will appear here.</small>
            </div>
          `
            : notifs
                .map(n => {
                  const icon =
                    n.type === 'registration'
                      ? '🎟️'
                      : n.type === 'cancellation'
                      ? '✕'
                      : n.type === 'club'
                      ? '🏛️'
                      : '📢';

                  return `
                  <div class="notif-item ${!n.read ? 'unread' : ''}" data-notif-id="${n.id}">
                    <div class="notif-icon-wrap ${n.type}">
                      ${icon}
                    </div>
                    <div class="notif-content">
                      <div class="notif-item-title">
                        <strong>${n.title}</strong>
                        ${!n.read ? `<span class="unread-dot"></span>` : ''}
                      </div>
                      <p class="notif-item-msg">${n.message}</p>
                      <span class="notif-item-time">${this.formatRelativeTime(n.createdAt)}</span>
                    </div>
                  </div>
                `;
                })
                .join('')
        }
      </div>

      ${
        notifs.length > 0
          ? `
          <div class="notif-dropdown-footer">
            <button class="btn-text-action text-danger" id="btn-clear-all-notifs">Clear all notifications</button>
          </div>
        `
          : ''
      }
    `;

    // Mark all read button
    document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
      this.markAllAsRead();
    });

    // Clear all button
    document.getElementById('btn-clear-all-notifs')?.addEventListener('click', () => {
      this.clearAll();
    });

    // Individual item click (marks read)
    dropdown.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const id = target.dataset.notifId;
        if (id) {
          this.markAsRead(id);
        }
      });
    });
  }

  private static formatRelativeTime(dateStr: string): string {
    try {
      const now = new Date().getTime();
      const time = new Date(dateStr).getTime();
      const diffSecs = Math.floor((now - time) / 1000);

      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
      return `${Math.floor(diffSecs / 86400)}d ago`;
    } catch {
      return dateStr;
    }
  }
}
