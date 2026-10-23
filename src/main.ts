/**
 * @file main.ts
 * @description Main entry point for the CampusCircle application.
 * Initializes storage, sets up role switching, and coordinates view rendering.
 */

import { StorageService } from './storage/storageService';
import { SessionService } from './auth/session';

function initApp(): void {
  // 1. Initialize persistent storage with initial seed data
  StorageService.init();

  // 2. Set up role switcher in the header
  SessionService.initRoleSwitcher('role-select');

  // 3. Render initial verification dashboard for Phase (a)
  renderPhaseAWelcome();

  // 4. Re-render when role switcher changes
  SessionService.subscribe(() => {
    renderPhaseAWelcome();
  });
}

function renderPhaseAWelcome(): void {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const currentUser = SessionService.getCurrentUser();
  const clubs = StorageService.getClubs();
  const events = StorageService.getEvents();
  const registrations = StorageService.getRegistrations();
  const notifications = StorageService.getNotifications();
  const reports = StorageService.getReports();

  mainContent.innerHTML = `
    <div style="max-width: 750px; margin: 2rem auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
        <span style="font-size: 2rem;">🚀</span>
        <div>
          <h2 style="font-size: 1.5rem; color: #1e293b; margin: 0;">CampusCircle — System Initialized</h2>
          <p style="color: #64748b; margin-top: 0.25rem;">Phase (a) Setup, strict models, and persistent storage are ready.</p>
        </div>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
        <p style="font-weight: 600; color: #1e40af; margin-bottom: 0.25rem;">Active Persona:</p>
        <p style="color: #1e293b;">
          <strong>${currentUser.name}</strong> (${currentUser.email}) — 
          <span style="background: #dbeafe; color: #1e40af; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; text-transform: capitalize;">
            ${currentUser.role.replace('_', ' ')}
          </span>
        </p>
      </div>

      <h3 style="font-size: 1.1rem; color: #334155; margin-bottom: 0.75rem;">Loaded Storage Entities (from Seed Data):</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; text-align: center; background: #f8fafc;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb;">${clubs.length}</div>
          <div style="font-size: 0.8rem; color: #64748b;">Clubs</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; text-align: center; background: #f8fafc;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb;">${events.length}</div>
          <div style="font-size: 0.8rem; color: #64748b;">Events</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; text-align: center; background: #f8fafc;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb;">${registrations.length}</div>
          <div style="font-size: 0.8rem; color: #64748b;">Registrations</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; text-align: center; background: #f8fafc;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb;">${notifications.length}</div>
          <div style="font-size: 0.8rem; color: #64748b;">Notifications</div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.75rem; text-align: center; background: #f8fafc;">
          <div style="font-size: 1.5rem; font-weight: bold; color: #2563eb;">${reports.length}</div>
          <div style="font-size: 0.8rem; color: #64748b;">Reports</div>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.875rem; color: #64748b;">Next phase: Student Event & Club Browsing</span>
        <button id="btn-reset-storage" style="background: none; border: 1px solid #cbd5e1; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.8rem; color: #64748b; cursor: pointer;">
          Reset Storage to Defaults
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-reset-storage')?.addEventListener('click', () => {
    StorageService.resetToDefaults();
    renderPhaseAWelcome();
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', initApp);
