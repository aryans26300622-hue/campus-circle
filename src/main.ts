/**
 * @file main.ts
 * @description Main application controller and router for CampusCircle.
 * Coordinates view rendering across HLD modules based on active navigation tab and user role.
 */

import { StorageService } from './storage/storageService';
import { SessionService } from './auth/session';
import { ClubDiscoveryModule } from './modules/club-discovery/clubDiscovery';
import { EventManagementModule } from './modules/event-management/eventManagement';
import { ParticipationModule } from './modules/participation/participation';
import { ClubManagementModule } from './modules/club-management/clubManagement';
import { UniversityAdminModule } from './modules/university-admin/universityAdmin';
import { NotificationServiceModule } from './modules/notifications/notificationService';

type NavTab = 'events' | 'clubs' | 'my-registrations' | 'club-admin' | 'platform-admin';

class AppController {
  private static activeTab: NavTab = 'events';

  public static init(): void {
    // 1. Initialize localStorage persistence with seed data
    StorageService.init();

    // 2. Initialize header role switcher & notification bell
    SessionService.initRoleSwitcher('role-select');
    NotificationServiceModule.init();

    // 3. Set up navigation tab click listeners
    this.initNavigation();

    // 4. Listen for persona/role changes
    SessionService.subscribe(user => {
      this.updateNavigationVisibility(user.role);
      NotificationServiceModule.updateUI();
      // Auto-switch to appropriate landing tab when role changes
      if (user.role === 'club_admin') {
        this.setActiveTab('club-admin');
      } else if (user.role === 'platform_admin') {
        this.setActiveTab('platform-admin');
      } else {
        this.setActiveTab('events');
      }
    });

    // 5. Initial render
    const currentUser = SessionService.getCurrentUser();
    this.updateNavigationVisibility(currentUser.role);
    this.renderActiveTab();

    // 6. Footer Reset Button
    document.getElementById('btn-footer-reset-data')?.addEventListener('click', () => {
      if (window.confirm('Reset all demo clubs, events, registrations, and notifications back to initial seed state?')) {
        StorageService.resetToDefaults();
        NotificationServiceModule.updateUI();
        SessionService.initRoleSwitcher('role-select');
        this.renderActiveTab();
      }
    });
  }

  private static initNavigation(): void {
    const nav = document.getElementById('main-nav');
    nav?.addEventListener('click', e => {
      const target = (e.target as HTMLElement).closest('.nav-tab') as HTMLButtonElement | null;
      if (!target) return;

      const tab = target.dataset.tab as NavTab;
      if (tab) {
        this.setActiveTab(tab);
      }
    });

    // Brand logo returns to Events tab
    document.getElementById('brand-logo')?.addEventListener('click', e => {
      e.preventDefault();
      this.setActiveTab('events');
    });
  }

  public static setActiveTab(tab: NavTab): void {
    this.activeTab = tab;

    // Update active class on nav buttons
    const buttons = document.querySelectorAll('.nav-tab');
    buttons.forEach(btn => {
      const buttonTab = (btn as HTMLElement).dataset.tab;
      if (buttonTab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderActiveTab();
  }

  private static updateNavigationVisibility(role: string): void {
    const clubAdminTab = document.getElementById('tab-club-admin');
    const platformAdminTab = document.getElementById('tab-platform-admin');
    const myRegistrationsTab = document.getElementById('tab-my-registrations');

    if (role === 'club_admin') {
      clubAdminTab?.classList.remove('hidden');
      platformAdminTab?.classList.add('hidden');
    } else if (role === 'platform_admin') {
      platformAdminTab?.classList.remove('hidden');
      clubAdminTab?.classList.add('hidden');
    } else {
      // Student
      clubAdminTab?.classList.add('hidden');
      platformAdminTab?.classList.add('hidden');
    }

    // Only students have 'My Registrations'
    if (role === 'student') {
      myRegistrationsTab?.classList.remove('hidden');
    } else {
      myRegistrationsTab?.classList.add('hidden');
    }
  }

  private static renderActiveTab(): void {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (this.activeTab) {
      case 'events':
        EventManagementModule.renderFeed(mainContent);
        break;

      case 'clubs':
        ClubDiscoveryModule.render(mainContent);
        break;

      case 'my-registrations':
        ParticipationModule.renderMyRegistrations(mainContent, () => this.setActiveTab('events'));
        break;

      case 'club-admin':
        ClubManagementModule.render(mainContent);
        break;

      case 'platform-admin':
        UniversityAdminModule.render(mainContent);
        break;

      default:
        EventManagementModule.renderFeed(mainContent);
    }
  }




}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AppController.init();
});
