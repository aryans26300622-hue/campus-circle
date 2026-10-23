/**
 * @file universityAdmin.ts
 * @description Implements HLD Module 5: University Administration.
 * Provides platform-wide oversight, reviewing new club applications, inspecting student activity,
 * and moderating flagged reports (resolving or removing reported items).
 */

import { StorageService } from '../../storage/storageService';
import { SessionService } from '../../auth/session';
import { Report } from '../../models/report';
import { AppNotification } from '../../models/notification';

type AdminSubTab = 'reports' | 'club-approvals' | 'all-content';

export class UniversityAdminModule {
  private static currentSubTab: AdminSubTab = 'reports';
  private static reportFilter: 'all' | 'pending' | 'resolved' = 'all';

  /**
   * Renders the University Administration Portal into the container.
   */
  public static render(container: HTMLElement): void {
    const currentUser = SessionService.getCurrentUser();

    if (currentUser.role !== 'platform_admin') {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">🛡️</p>
          <h3>Platform Admin Access Required</h3>
          <p>Please switch your persona to <strong>Dr. Carol Vance (Platform Admin)</strong> using the dropdown in the header.</p>
        </div>
      `;
      return;
    }

    const clubs = StorageService.getClubs();
    const events = StorageService.getEvents();
    const registrations = StorageService.getRegistrations().filter(r => r.status === 'REGISTERED');
    const reports = StorageService.getReports();
    const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
    const pendingClubsCount = clubs.filter(c => c.status === 'pending').length;

    container.innerHTML = `
      <section class="section-container">
        <!-- Dashboard Header -->
        <div class="section-header">
          <div>
            <h1 class="page-title">University Administration & Oversight</h1>
            <p class="page-subtitle">CampusCircle administrative portal: moderate flagged reports, approve clubs, and oversee campus engagement.</p>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="admin-kpi-grid">
          <div class="kpi-card">
            <span class="kpi-icon">🏛️</span>
            <div>
              <div class="kpi-value">${clubs.length}</div>
              <div class="kpi-label">Total Clubs (${pendingClubsCount} Pending Approval)</div>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">📅</span>
            <div>
              <div class="kpi-value">${events.length}</div>
              <div class="kpi-label">Active Campus Events</div>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">🎟️</span>
            <div>
              <div class="kpi-value">${registrations.length}</div>
              <div class="kpi-label">Total Student Registrations</div>
            </div>
          </div>
          <div class="kpi-card">
            <span class="kpi-icon">🚩</span>
            <div>
              <div class="kpi-value ${pendingReportsCount > 0 ? 'text-danger' : ''}">${pendingReportsCount}</div>
              <div class="kpi-label">Pending Moderation Reports</div>
            </div>
          </div>
        </div>

        <!-- Alert Banner -->
        <div id="platform-admin-feedback" class="feedback-banner hidden"></div>

        <!-- Secondary Sub-navigation Tabs -->
        <div class="subnav-tabs">
          <button class="subnav-btn ${this.currentSubTab === 'reports' ? 'active' : ''}" data-subtab="reports">
            🚩 Moderation Reports ${pendingReportsCount > 0 ? `<span class="badge badge-danger">${pendingReportsCount}</span>` : ''}
          </button>
          <button class="subnav-btn ${this.currentSubTab === 'club-approvals' ? 'active' : ''}" data-subtab="club-approvals">
            📋 Club Recognition Applications ${pendingClubsCount > 0 ? `<span class="badge badge-warning">${pendingClubsCount}</span>` : ''}
          </button>
          <button class="subnav-btn ${this.currentSubTab === 'all-content' ? 'active' : ''}" data-subtab="all-content">
            📊 Platform Oversight (All Clubs & Events)
          </button>
        </div>

        <!-- Dynamic Subtab Content -->
        <div id="subtab-content" class="subtab-content">
          <!-- Rendered below -->
        </div>
      </section>
    `;

    this.renderSubTabContent(container);
    this.attachSubTabNavigation(container);
  }

  private static attachSubTabNavigation(container: HTMLElement): void {
    container.querySelectorAll('.subnav-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const subtab = target.dataset.subtab as AdminSubTab;
        if (subtab) {
          this.currentSubTab = subtab;
          this.render(container);
        }
      });
    });
  }

  private static renderSubTabContent(container: HTMLElement): void {
    const content = container.querySelector('#subtab-content');
    if (!content) return;

    switch (this.currentSubTab) {
      case 'reports':
        this.renderReportsSection(content as HTMLElement, container);
        break;
      case 'club-approvals':
        this.renderClubApprovalsSection(content as HTMLElement, container);
        break;
      case 'all-content':
        this.renderAllContentSection(content as HTMLElement, container);
        break;
    }
  }

  // =========================================================================
  // SUBTAB 1: MODERATION REPORTS
  // =========================================================================
  private static renderReportsSection(target: HTMLElement, rootContainer: HTMLElement): void {
    const allReports = StorageService.getReports();

    const filtered = allReports.filter(r => {
      if (this.reportFilter === 'all') return true;
      return r.status === this.reportFilter;
    });

    target.innerHTML = `
      <div class="admin-panel-card">
        <div class="panel-header-with-actions">
          <div>
            <h3 class="panel-title">Moderation & Safety Reports</h3>
            <p class="panel-desc">Review student complaints and concerns regarding events or clubs.</p>
          </div>
          <div class="filter-pills">
            <button class="pill-btn ${this.reportFilter === 'all' ? 'active' : ''}" data-filter="all">All (${allReports.length})</button>
            <button class="pill-btn ${this.reportFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pending</button>
            <button class="pill-btn ${this.reportFilter === 'resolved' ? 'active' : ''}" data-filter="resolved">Resolved</button>
          </div>
        </div>

        ${
          filtered.length === 0
            ? `
            <div class="empty-state">
              <p class="empty-icon">✅</p>
              <h3>No Reports in this view</h3>
              <p>Everything looks clean and safe on campus!</p>
            </div>
          `
            : `
            <div class="reports-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Reported Item</th>
                    <th>Reason</th>
                    <th>Reporter</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered
                    .map(rep => {
                      const isPending = rep.status === 'pending';
                      return `
                      <tr>
                        <td>
                          <span class="badge category-badge-inline">
                            ${rep.targetType.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <strong>${rep.targetTitle}</strong><br />
                          <small style="color: var(--text-light);">ID: ${rep.targetId}</small>
                        </td>
                        <td style="max-width: 320px;">
                          ${rep.reason}
                          ${rep.resolutionNotes ? `<div style="font-size: 0.8rem; color: var(--success); margin-top: 0.25rem;">Note: ${rep.resolutionNotes}</div>` : ''}
                        </td>
                        <td>${rep.reporterName}</td>
                        <td>
                          <span class="badge ${rep.status === 'pending' ? 'badge-warning' : rep.status === 'resolved' ? 'badge-success' : 'badge-open'}">
                            ${rep.status}
                          </span>
                        </td>
                        <td>
                          ${
                            isPending
                              ? `
                              <div class="table-actions">
                                <button 
                                  class="btn btn-outline btn-sm btn-resolve-report" 
                                  data-report-id="${rep.id}">
                                  ✓ Resolve
                                </button>
                                <button 
                                  class="btn btn-outline btn-sm text-danger btn-remove-item" 
                                  data-report-id="${rep.id}" 
                                  data-target-type="${rep.targetType}" 
                                  data-target-id="${rep.targetId}" 
                                  data-target-title="${rep.targetTitle}">
                                  🗑️ Remove Item
                                </button>
                                <button 
                                  class="btn btn-secondary btn-sm btn-dismiss-report" 
                                  data-report-id="${rep.id}">
                                  Dismiss
                                </button>
                              </div>
                            `
                              : `<span style="color: var(--text-light); font-size: 0.8rem;">Completed</span>`
                          }
                        </td>
                      </tr>
                    `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          `
        }
      </div>
    `;

    // Filter clicks
    target.querySelectorAll('.filter-pills .pill-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const filter = (e.currentTarget as HTMLElement).dataset.filter as any;
        if (filter) {
          this.reportFilter = filter;
          this.renderReportsSection(target, rootContainer);
        }
      });
    });

    // Resolve click
    target.querySelectorAll('.btn-resolve-report').forEach(btn => {
      btn.addEventListener('click', e => {
        const reportId = (e.currentTarget as HTMLElement).dataset.reportId;
        if (!reportId) return;
        this.updateReportStatus(reportId, 'resolved', 'Resolved by University Administration.', rootContainer);
      });
    });

    // Dismiss click
    target.querySelectorAll('.btn-dismiss-report').forEach(btn => {
      btn.addEventListener('click', e => {
        const reportId = (e.currentTarget as HTMLElement).dataset.reportId;
        if (!reportId) return;
        this.updateReportStatus(reportId, 'dismissed', 'Dismissed as non-actionable.', rootContainer);
      });
    });

    // Remove Item click
    target.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', e => {
        const targetEl = e.currentTarget as HTMLElement;
        const reportId = targetEl.dataset.reportId;
        const targetType = targetEl.dataset.targetType;
        const targetId = targetEl.dataset.targetId;
        const targetTitle = targetEl.dataset.targetTitle;
        if (!reportId || !targetType || !targetId) return;

        const confirmRemove = window.confirm(
          `Are you sure you want to permanently remove the reported ${targetType} "${targetTitle}"?\nThis resolves the safety report.`
        );

        if (confirmRemove) {
          this.removeReportedItem(reportId, targetType, targetId, targetTitle || 'item', rootContainer);
        }
      });
    });
  }

  private static updateReportStatus(reportId: string, status: Report['status'], note: string, rootContainer: HTMLElement): void {
    const reports = StorageService.getReports();
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    report.status = status;
    report.resolutionNotes = note;
    StorageService.saveReports(reports);

    this.render(rootContainer);
    this.showFeedback(rootContainer, `Report marked as ${status}.`, true);
  }

  private static removeReportedItem(reportId: string, targetType: string, targetId: string, targetTitle: string, rootContainer: HTMLElement): void {
    if (targetType === 'event') {
      let events = StorageService.getEvents();
      events = events.filter(e => e.id !== targetId);
      StorageService.saveEvents(events);

      // Cancel associated registrations
      const regs = StorageService.getRegistrations();
      regs.forEach(r => {
        if (r.eventId === targetId && r.status === 'REGISTERED') {
          r.status = 'CANCELLED';
          r.cancelledAt = new Date().toISOString();
        }
      });
      StorageService.saveRegistrations(regs);
    } else if (targetType === 'club') {
      const clubs = StorageService.getClubs();
      const club = clubs.find(c => c.id === targetId);
      if (club) {
        club.status = 'rejected';
        StorageService.saveClubs(clubs);
      }
    }

    this.updateReportStatus(reportId, 'resolved', `Removed violating ${targetType} "${targetTitle}".`, rootContainer);
  }

  // =========================================================================
  // SUBTAB 2: CLUB RECOGNITION APPLICATIONS
  // =========================================================================
  private static renderClubApprovalsSection(target: HTMLElement, rootContainer: HTMLElement): void {
    const clubs = StorageService.getClubs();
    const pendingClubs = clubs.filter(c => c.status === 'pending');
    const processedClubs = clubs.filter(c => c.status !== 'pending');

    target.innerHTML = `
      <div class="admin-panel-card">
        <h3 class="panel-title">Pending Recognition Applications (${pendingClubs.length})</h3>
        <p class="panel-desc">Evaluate student club applications for official university charter recognition.</p>

        ${
          pendingClubs.length === 0
            ? `
            <div class="empty-state" style="padding: 2rem;">
              <p class="empty-icon">🎉</p>
              <h4>No Pending Applications</h4>
              <p>All student club recognition applications have been evaluated.</p>
            </div>
          `
            : `
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Club Name</th>
                    <th>Category</th>
                    <th>Lead Contact</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendingClubs
                    .map(club => `
                    <tr>
                      <td>
                        <strong>${club.name}</strong><br />
                        <small style="color: var(--text-light);">Submitted: ${club.createdAt}</small>
                      </td>
                      <td><span class="badge category-badge-inline">${club.category}</span></td>
                      <td>
                        <strong>${club.leadName}</strong><br />
                        <small>${club.contactEmail}</small>
                      </td>
                      <td style="max-width: 320px;">${club.description}</td>
                      <td>
                        <div class="table-actions">
                          <button 
                            class="btn btn-primary btn-sm btn-approve-club" 
                            data-club-id="${club.id}" 
                            data-club-name="${club.name}">
                            ✓ Approve
                          </button>
                          <button 
                            class="btn btn-outline btn-sm text-danger btn-reject-club" 
                            data-club-id="${club.id}" 
                            data-club-name="${club.name}">
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  `)
                    .join('')}
                </tbody>
              </table>
            </div>
          `
        }

        <h3 class="panel-title" style="margin-top: 2rem;">Recognized & Processed Clubs</h3>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Club</th>
                <th>Category</th>
                <th>Lead</th>
                <th>Members</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${processedClubs
                .map(club => `
                <tr>
                  <td><strong>${club.name}</strong></td>
                  <td><span class="badge category-badge-inline">${club.category}</span></td>
                  <td>${club.leadName}</td>
                  <td>${club.memberCount}</td>
                  <td>
                    <span class="badge ${club.status === 'approved' ? 'badge-success' : 'badge-danger'}">
                      ${club.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              `)
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Approve Button
    target.querySelectorAll('.btn-approve-club').forEach(btn => {
      btn.addEventListener('click', e => {
        const targetEl = e.currentTarget as HTMLElement;
        const clubId = targetEl.dataset.clubId;
        const clubName = targetEl.dataset.clubName;
        if (!clubId) return;

        this.setClubRecognition(clubId, 'approved', clubName || 'Club', rootContainer);
      });
    });

    // Reject Button
    target.querySelectorAll('.btn-reject-club').forEach(btn => {
      btn.addEventListener('click', e => {
        const targetEl = e.currentTarget as HTMLElement;
        const clubId = targetEl.dataset.clubId;
        const clubName = targetEl.dataset.clubName;
        if (!clubId) return;

        this.setClubRecognition(clubId, 'rejected', clubName || 'Club', rootContainer);
      });
    });
  }

  private static setClubRecognition(clubId: string, status: 'approved' | 'rejected', clubName: string, rootContainer: HTMLElement): void {
    const clubs = StorageService.getClubs();
    const club = clubs.find(c => c.id === clubId);
    if (!club) return;

    club.status = status;
    StorageService.saveClubs(clubs);

    // Notify club lead
    const notifs = StorageService.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: club.leadId,
      title: `Club Application ${status === 'approved' ? 'Approved' : 'Declined'}`,
      message: `Your recognition application for "${club.name}" was ${status} by University Administration.`,
      type: 'club',
      read: false,
      createdAt: new Date().toISOString()
    };
    notifs.unshift(newNotif);
    StorageService.saveNotifications(notifs);

    this.render(rootContainer);
    this.showFeedback(rootContainer, `Club "${clubName}" has been ${status}.`, true);
  }

  // =========================================================================
  // SUBTAB 3: ALL CLUBS & EVENTS OVERSIGHT
  // =========================================================================
  private static renderAllContentSection(target: HTMLElement, rootContainer: HTMLElement): void {
    const events = StorageService.getEvents();

    target.innerHTML = `
      <div class="admin-panel-card">
        <h3 class="panel-title">All Campus Events Directory (${events.length})</h3>
        <p class="panel-desc">Administrative inventory of all scheduled and hosted student events.</p>

        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Host Club</th>
                <th>Category</th>
                <th>Date & Location</th>
                <th>Capacity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${events
                .map(ev => `
                <tr>
                  <td><strong>${ev.title}</strong></td>
                  <td>${ev.clubName}</td>
                  <td><span class="badge category-badge-inline">${ev.category}</span></td>
                  <td>${ev.date} (${ev.location})</td>
                  <td>${ev.registeredCount} / ${ev.capacity}</td>
                  <td>
                    <button 
                      class="btn btn-outline btn-sm text-danger btn-admin-delete-event" 
                      data-event-id="${ev.id}" 
                      data-event-title="${ev.title}">
                      Delete Event
                    </button>
                  </td>
                </tr>
              `)
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    target.querySelectorAll('.btn-admin-delete-event').forEach(btn => {
      btn.addEventListener('click', e => {
        const targetEl = e.currentTarget as HTMLElement;
        const eventId = targetEl.dataset.eventId;
        const eventTitle = targetEl.dataset.eventTitle;
        if (!eventId) return;

        const confirmed = window.confirm(`Platform Admin: Force-delete event "${eventTitle}"?`);
        if (confirmed) {
          let eventsList = StorageService.getEvents();
          eventsList = eventsList.filter(ev => ev.id !== eventId);
          StorageService.saveEvents(eventsList);

          this.render(rootContainer);
          this.showFeedback(rootContainer, `Event "${eventTitle}" force-deleted by admin.`, true);
        }
      });
    });
  }

  private static showFeedback(container: HTMLElement, message: string, isSuccess: boolean): void {
    const banner = container.querySelector('#platform-admin-feedback') as HTMLElement | null;
    if (!banner) return;

    banner.textContent = message;
    banner.className = `feedback-banner ${isSuccess ? 'feedback-success' : 'feedback-error'}`;
    banner.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 4500);
  }
}
