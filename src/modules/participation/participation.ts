/**
 * @file participation.ts
 * @description Implements HLD Module 2: Participation & Attendance.
 * Manages event registration, duplicate prevention, capacity enforcement, and "My Registrations".
 * Strict adherence to the CampusCircle Registration & Attendance LLD.
 */

import { Registration } from '../../models/registration';
import { StorageService } from '../../storage/storageService';
import { SessionService } from '../../auth/session';
import { AppNotification } from '../../models/notification';
import { NotificationServiceModule } from '../notifications/notificationService';

export interface RegistrationResult {
  success: boolean;
  message: string;
  registration?: Registration;
}

export class ParticipationModule {
  /**
   * Registers a student for a campus event.
   * Enforces user eligibility, duplicate registration blocking, and capacity limits.
   */
  public static register(studentId: string, eventId: string): RegistrationResult {
    const users = StorageService.getUsers();
    const student = users.find(u => u.id === studentId);
    if (!student || student.role !== 'student') {
      return { success: false, message: 'Only registered students can sign up for events.' };
    }

    const events = StorageService.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return { success: false, message: 'Event not found.' };
    }

    if (event.status !== 'upcoming') {
      return { success: false, message: 'Registration is closed for this event.' };
    }

    const registrations = StorageService.getRegistrations();

    // 1. Duplicate check (LLD Rule: For a given student and event, at most one active registration)
    const existingActive = registrations.find(
      r => r.studentId === studentId && r.eventId === eventId && r.status === 'REGISTERED'
    );
    if (existingActive) {
      return {
        success: false,
        message: 'You are already registered for this event. Duplicate registrations are blocked.'
      };
    }

    // 2. Capacity check (LLD Rule: Atomic capacity decision)
    if (event.registeredCount >= event.capacity) {
      return {
        success: false,
        message: 'This event is already at maximum capacity.'
      };
    }

    // 3. Create Registration
    const newReg: Registration = {
      registrationId: `reg-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      eventId: event.id,
      status: 'REGISTERED',
      registeredAt: new Date().toISOString()
    };

    registrations.push(newReg);
    event.registeredCount += 1;

    // 4. Persist registration and updated event count
    StorageService.saveRegistrations(registrations);
    StorageService.saveEvents(events);

    // 5. Create notification for student
    const notifications = StorageService.getNotifications();
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId: student.id,
      title: 'Registration Confirmed',
      message: `You are registered for "${event.title}" on ${event.date} at ${event.time} (${event.location}).`,
      type: 'registration',
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    StorageService.saveNotifications(notifications);
    NotificationServiceModule.updateUI();

    return {
      success: true,
      message: `Successfully registered for "${event.title}"!`,
      registration: newReg
    };
  }

  /**
   * Cancels a student's active registration.
   * Sets status to CANCELLED and preserves audit history per LLD design.
   */
  public static cancelRegistration(studentId: string, eventId: string): RegistrationResult {
    const registrations = StorageService.getRegistrations();
    const targetReg = registrations.find(
      r => r.studentId === studentId && r.eventId === eventId && r.status === 'REGISTERED'
    );

    if (!targetReg) {
      return { success: false, message: 'Active registration record not found.' };
    }

    const events = StorageService.getEvents();
    const event = events.find(e => e.id === eventId);

    // Update status to CANCELLED and record timestamp
    targetReg.status = 'CANCELLED';
    targetReg.cancelledAt = new Date().toISOString();

    if (event) {
      event.registeredCount = Math.max(0, event.registeredCount - 1);
      StorageService.saveEvents(events);
    }

    StorageService.saveRegistrations(registrations);

    // Create cancellation notification
    if (event) {
      const notifications = StorageService.getNotifications();
      const cancelNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        userId: studentId,
        title: 'Registration Cancelled',
        message: `Your registration for "${event.title}" has been cancelled. Your seat was freed.`,
        type: 'cancellation',
        read: false,
        createdAt: new Date().toISOString()
      };
      notifications.unshift(cancelNotif);
      StorageService.saveNotifications(notifications);
      NotificationServiceModule.updateUI();
    }

    return {
      success: true,
      message: event ? `Registration for "${event.title}" cancelled.` : 'Registration cancelled.'
    };
  }

  /**
   * Renders the "My Registrations" view for the current student.
   */
  public static renderMyRegistrations(container: HTMLElement, onBrowseClick?: () => void): void {
    const currentUser = SessionService.getCurrentUser();
    if (currentUser.role !== 'student') {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">ℹ️</p>
          <h3>Student Persona Required</h3>
          <p>Please switch your persona to a Student in the top bar to view event registrations.</p>
        </div>
      `;
      return;
    }

    const registrations = StorageService.getRegistrations();
    const events = StorageService.getEvents();

    const activeRegs = registrations.filter(
      r => r.studentId === currentUser.id && r.status === 'REGISTERED'
    );

    const cancelledRegs = registrations.filter(
      r => r.studentId === currentUser.id && r.status === 'CANCELLED'
    );

    container.innerHTML = `
      <section class="section-container">
        <div class="section-header">
          <div>
            <h1 class="page-title">My Event Registrations</h1>
            <p class="page-subtitle">Manage your upcoming event passes and schedule.</p>
          </div>
          ${
            activeRegs.length > 0
              ? `<button class="btn btn-outline btn-sm" id="btn-browse-more">Explore More Events</button>`
              : ''
          }
        </div>

        <!-- Notification / Banner -->
        <div id="reg-feedback" class="feedback-banner hidden"></div>

        <!-- Active Registrations Grid -->
        <div class="registrations-list">
          ${
            activeRegs.length === 0
              ? `
              <div class="empty-state">
                <p class="empty-icon">🎟️</p>
                <h3>No Active Registrations</h3>
                <p>You haven't signed up for any events yet. Check out what is happening on campus!</p>
                <div style="margin-top: 1.25rem;">
                  <button class="btn btn-primary" id="btn-empty-browse">Browse Campus Events</button>
                </div>
              </div>
            `
              : activeRegs
                  .map(reg => {
                    const event = events.find(e => e.id === reg.eventId);
                    if (!event) return '';

                    const formattedRegTime = new Date(reg.registeredAt).toLocaleDateString(
                      'en-US',
                      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    );

                    return `
                    <div class="registration-card">
                      <div class="reg-card-left">
                        <img 
                          src="${event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80'}" 
                          alt="${event.title}" 
                          class="reg-card-img" 
                        />
                      </div>

                      <div class="reg-card-body">
                        <div class="reg-header">
                          <span class="badge category-badge-inline">${event.category}</span>
                          <span class="badge badge-success">✓ Confirmed</span>
                        </div>

                        <h3 class="reg-title">${event.title}</h3>
                        <p class="reg-host">Hosted by <strong>${event.clubName}</strong></p>

                        <div class="reg-info-grid">
                          <div>📅 <strong>Date:</strong> ${event.date} at ${event.time}</div>
                          <div>📍 <strong>Location:</strong> ${event.location}</div>
                          <div>⏱️ <strong>Registered On:</strong> ${formattedRegTime}</div>
                          <div>🆔 <strong>Pass ID:</strong> <code>${reg.registrationId}</code></div>
                        </div>
                      </div>

                      <div class="reg-card-actions">
                        <button 
                          class="btn btn-outline btn-sm btn-cancel-reg text-danger" 
                          data-event-id="${event.id}" 
                          data-event-title="${event.title}">
                          Cancel Registration
                        </button>
                      </div>
                    </div>
                  `;
                  })
                  .join('')
          }
        </div>

        ${
          cancelledRegs.length > 0
            ? `
            <div class="cancelled-history-section">
              <h3 class="cancelled-history-title">Cancelled Registrations History (${cancelledRegs.length})</h3>
              <p class="cancelled-history-desc">Kept for historical audit trail as specified in the platform architecture.</p>
              <div class="cancelled-tags">
                ${cancelledRegs
                  .map(c => {
                    const ev = events.find(e => e.id === c.eventId);
                    return `
                      <span class="cancelled-item">
                        ✕ ${ev ? ev.title : c.eventId} (Cancelled)
                      </span>
                    `;
                  })
                  .join('')}
              </div>
            </div>
          `
            : ''
        }
      </section>
    `;

    // Attach event listeners
    const browseBtn = document.getElementById('btn-browse-more') || document.getElementById('btn-empty-browse');
    browseBtn?.addEventListener('click', () => {
      if (onBrowseClick) onBrowseClick();
    });

    const cancelButtons = container.querySelectorAll('.btn-cancel-reg');
    cancelButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const eventId = target.dataset.eventId;
        const eventTitle = target.dataset.eventTitle;
        if (!eventId) return;

        const confirmCancel = window.confirm(
          `Are you sure you want to cancel your registration for "${eventTitle}"?\nYour seat will be released for other students.`
        );

        if (confirmCancel) {
          const result = this.cancelRegistration(currentUser.id, eventId);
          this.renderMyRegistrations(container, onBrowseClick);
          this.showFeedback(container, result.message, result.success);
        }
      });
    });
  }

  private static showFeedback(container: HTMLElement, message: string, isSuccess: boolean): void {
    const banner = container.querySelector('#reg-feedback') as HTMLElement | null;
    if (!banner) return;

    banner.textContent = message;
    banner.className = `feedback-banner ${isSuccess ? 'feedback-success' : 'feedback-error'}`;
    banner.classList.remove('hidden');

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 4000);
  }
}
