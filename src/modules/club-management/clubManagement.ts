/**
 * @file clubManagement.ts
 * @description Implements HLD Module 4: Club Management.
 * Provides Club Admin features: manage club info, create, edit, delete club events, and inspect attendee rosters.
 */

import { CampusEvent, EventCategory } from '../../models/event';
import { StorageService } from '../../storage/storageService';
import { SessionService } from '../../auth/session';

export class ClubManagementModule {
  private static editingEventId: string | null = null;

  /**
   * Renders the Club Admin Portal view.
   */
  public static render(container: HTMLElement): void {
    const currentUser = SessionService.getCurrentUser();

    if (currentUser.role !== 'club_admin' || !currentUser.clubId) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">🛡️</p>
          <h3>Club Admin Access Required</h3>
          <p>Please switch your persona to <strong>Club Admin (Bob Smith - Robotics Society)</strong> using the dropdown in the header to manage club events.</p>
        </div>
      `;
      return;
    }

    const clubs = StorageService.getClubs();
    const club = clubs.find(c => c.id === currentUser.clubId);

    if (!club) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">⚠️</p>
          <h3>Assigned Club Not Found</h3>
          <p>Unable to locate the club profile assigned to your account.</p>
        </div>
      `;
      return;
    }

    const events = StorageService.getEvents().filter(e => e.clubId === club.id);

    container.innerHTML = `
      <section class="section-container">
        <!-- Club Overview Header -->
        <div class="admin-club-banner">
          <div class="admin-club-info">
            <span class="badge category-badge-inline">${club.category}</span>
            <span class="badge ${club.status === 'approved' ? 'badge-success' : 'badge-warning'}">
              Status: ${club.status}
            </span>
            <h1 class="page-title">${club.name} — Club Admin Portal</h1>
            <p class="page-subtitle">${club.description}</p>
            <div class="club-meta" style="border-top: none; padding-top: 0.5rem; margin-top: 0.5rem;">
              <span>👥 <strong>${club.memberCount}</strong> Members</span>
              <span>👤 Lead: <strong>${club.leadName}</strong></span>
              <span>✉️ <strong>${club.contactEmail}</strong></span>
            </div>
          </div>
          <div class="admin-actions">
            <button class="btn btn-primary" id="btn-open-create-event-modal">
              + Create New Event
            </button>
          </div>
        </div>

        <!-- Feedback Alert Banner -->
        <div id="club-admin-feedback" class="feedback-banner hidden"></div>

        <!-- Club Events Section -->
        <div class="admin-section-header">
          <div>
            <h2 style="font-size: 1.3rem; font-weight: 700; color: var(--text-main);">Events Managed by ${club.name}</h2>
            <p style="font-size: 0.85rem; color: var(--text-muted);">Manage upcoming event details, capacity, and view registered attendee rosters.</p>
          </div>
          <span class="badge badge-open">${events.length} Event(s)</span>
        </div>

        <!-- Events Table / Cards -->
        <div class="admin-events-list">
          ${
            events.length === 0
              ? `
              <div class="empty-state">
                <p class="empty-icon">📅</p>
                <h3>No Events Created Yet</h3>
                <p>Your club has not posted any events yet. Click "+ Create New Event" above to get started!</p>
              </div>
            `
              : `
              <div class="admin-table-wrap">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>Event Title</th>
                      <th>Category</th>
                      <th>Date & Time</th>
                      <th>Location</th>
                      <th>Capacity</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${events
                      .map(ev => {
                        const isFull = ev.registeredCount >= ev.capacity;
                        return `
                        <tr>
                          <td>
                            <strong>${ev.title}</strong>
                          </td>
                          <td>
                            <span class="badge category-badge-inline">${ev.category}</span>
                          </td>
                          <td>
                            ${ev.date}<br />
                            <small style="color: var(--text-muted);">${ev.time}</small>
                          </td>
                          <td>${ev.location}</td>
                          <td>${ev.capacity} seats</td>
                          <td>
                            <span class="badge ${isFull ? 'badge-danger' : 'badge-success'}">
                              ${ev.registeredCount} / ${ev.capacity}
                            </span>
                          </td>
                          <td>
                            <div class="table-actions">
                              <button 
                                class="btn btn-outline btn-sm btn-view-attendees" 
                                data-event-id="${ev.id}" 
                                data-event-title="${ev.title}">
                                👥 Attendees (${ev.registeredCount})
                              </button>
                              <button 
                                class="btn btn-secondary btn-sm btn-edit-event" 
                                data-event-id="${ev.id}">
                                ✏️ Edit
                              </button>
                              <button 
                                class="btn btn-outline btn-sm text-danger btn-delete-event" 
                                data-event-id="${ev.id}" 
                                data-event-title="${ev.title}">
                                🗑️ Delete
                              </button>
                            </div>
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

        <!-- Event Modal (Create / Edit) -->
        <div id="event-modal" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="modal-event-title">Create New Club Event</h3>
              <button class="modal-close-btn" id="btn-close-event-modal">&times;</button>
            </div>
            <form id="event-form" class="modal-form">
              <div class="form-group">
                <label for="form-title">Event Title *</label>
                <input type="text" id="form-title" required placeholder="e.g. Autonomous Robotics Hackathon" />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="form-category">Category *</label>
                  <select id="form-category" required>
                    <option value="Workshop">Workshop</option>
                    <option value="Competition">Competition</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Social">Social</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="form-capacity">Seat Capacity *</label>
                  <input type="number" id="form-capacity" min="1" max="500" value="30" required />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="form-date">Date *</label>
                  <input type="date" id="form-date" required />
                </div>

                <div class="form-group">
                  <label for="form-time">Time *</label>
                  <input type="time" id="form-time" required value="16:00" />
                </div>
              </div>

              <div class="form-group">
                <label for="form-location">Campus Location *</label>
                <input type="text" id="form-location" required placeholder="e.g. Makerspace Lab 3B or Main Auditorium" />
              </div>

              <div class="form-group">
                <label for="form-desc">Description *</label>
                <textarea id="form-desc" rows="3" required placeholder="Describe what attendees will learn or participate in..."></textarea>
              </div>

              <div class="form-group">
                <label for="form-image">Image URL (Optional)</label>
                <input type="url" id="form-image" placeholder="https://images.unsplash.com/..." />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-modal">Cancel</button>
                <button type="submit" class="btn btn-primary" id="btn-save-event">Save Event</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Attendees Modal -->
        <div id="attendees-modal" class="modal-overlay hidden">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="attendees-modal-title">Registered Students Roster</h3>
              <button class="modal-close-btn" id="btn-close-attendees-modal">&times;</button>
            </div>
            <div class="modal-body" id="attendees-modal-content">
              <!-- Rendered dynamically -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-dismiss-attendees-modal">Close</button>
            </div>
          </div>
        </div>
      </section>
    `;

    this.attachEvents(container, club.id, club.name);
  }

  private static attachEvents(container: HTMLElement, clubId: string, clubName: string): void {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form') as HTMLFormElement | null;
    const modalTitle = document.getElementById('modal-event-title');

    // Open Create Modal
    document.getElementById('btn-open-create-event-modal')?.addEventListener('click', () => {
      this.editingEventId = null;
      if (modalTitle) modalTitle.textContent = 'Create New Club Event';
      form?.reset();
      // Set default date to 1 week from today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      const dateInput = document.getElementById('form-date') as HTMLInputElement | null;
      if (dateInput) dateInput.value = defaultDate.toISOString().split('T')[0];

      modal?.classList.remove('hidden');
    });

    // Close Modal actions
    const closeModal = () => modal?.classList.add('hidden');
    document.getElementById('btn-close-event-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);

    // Save Form (Create or Edit)
    form?.addEventListener('submit', e => {
      e.preventDefault();
      this.saveEvent(clubId, clubName, container);
      closeModal();
    });

    // Edit Event Buttons
    container.querySelectorAll('.btn-edit-event').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const eventId = target.dataset.eventId;
        if (!eventId) return;

        this.openEditModal(eventId);
      });
    });

    // Delete Event Buttons
    container.querySelectorAll('.btn-delete-event').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const eventId = target.dataset.eventId;
        const eventTitle = target.dataset.eventTitle;
        if (!eventId) return;

        const confirmed = window.confirm(`Are you sure you want to delete the event "${eventTitle}"?\nThis cannot be undone.`);
        if (confirmed) {
          this.deleteEvent(eventId, container);
        }
      });
    });

    // View Attendees Buttons
    container.querySelectorAll('.btn-view-attendees').forEach(btn => {
      btn.addEventListener('click', e => {
        const target = e.currentTarget as HTMLElement;
        const eventId = target.dataset.eventId;
        const eventTitle = target.dataset.eventTitle;
        if (!eventId) return;

        this.openAttendeesModal(eventId, eventTitle || 'Event');
      });
    });
  }

  private static openEditModal(eventId: string): void {
    const events = StorageService.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    this.editingEventId = event.id;
    const modal = document.getElementById('event-modal');
    const modalTitle = document.getElementById('modal-event-title');
    if (modalTitle) modalTitle.textContent = `Edit Event: ${event.title}`;

    (document.getElementById('form-title') as HTMLInputElement).value = event.title;
    (document.getElementById('form-category') as HTMLSelectElement).value = event.category;
    (document.getElementById('form-capacity') as HTMLInputElement).value = event.capacity.toString();
    (document.getElementById('form-date') as HTMLInputElement).value = event.date;
    (document.getElementById('form-time') as HTMLInputElement).value = event.time;
    (document.getElementById('form-location') as HTMLInputElement).value = event.location;
    (document.getElementById('form-desc') as HTMLTextAreaElement).value = event.description;
    (document.getElementById('form-image') as HTMLInputElement).value = event.imageUrl || '';

    modal?.classList.remove('hidden');
  }

  private static saveEvent(clubId: string, clubName: string, container: HTMLElement): void {
    const events = StorageService.getEvents();

    const title = (document.getElementById('form-title') as HTMLInputElement).value;
    const category = (document.getElementById('form-category') as HTMLSelectElement).value as EventCategory;
    const capacity = parseInt((document.getElementById('form-capacity') as HTMLInputElement).value, 10);
    const date = (document.getElementById('form-date') as HTMLInputElement).value;
    const time = (document.getElementById('form-time') as HTMLInputElement).value;
    const location = (document.getElementById('form-location') as HTMLInputElement).value;
    const description = (document.getElementById('form-desc') as HTMLTextAreaElement).value;
    const imageUrl = (document.getElementById('form-image') as HTMLInputElement).value;

    if (this.editingEventId) {
      // Editing existing event
      const target = events.find(e => e.id === this.editingEventId);
      if (target) {
        target.title = title;
        target.category = category;
        target.capacity = capacity;
        target.date = date;
        target.time = time;
        target.location = location;
        target.description = description;
        if (imageUrl) target.imageUrl = imageUrl;

        StorageService.saveEvents(events);
        this.render(container);
        this.showFeedback(container, `Event "${title}" updated successfully!`, true);
      }
    } else {
      // Creating new event
      const newEvent: CampusEvent = {
        id: `evt-${Date.now()}`,
        clubId,
        clubName,
        title,
        description,
        category,
        date,
        time,
        location,
        capacity,
        registeredCount: 0,
        status: 'upcoming',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString()
      };

      events.unshift(newEvent);
      StorageService.saveEvents(events);
      this.render(container);
      this.showFeedback(container, `New event "${title}" published successfully!`, true);
    }
  }

  private static deleteEvent(eventId: string, container: HTMLElement): void {
    let events = StorageService.getEvents();
    const eventToDelete = events.find(e => e.id === eventId);
    if (!eventToDelete) return;

    events = events.filter(e => e.id !== eventId);
    StorageService.saveEvents(events);

    // Also cancel active registrations for this event
    const registrations = StorageService.getRegistrations();
    registrations.forEach(r => {
      if (r.eventId === eventId && r.status === 'REGISTERED') {
        r.status = 'CANCELLED';
        r.cancelledAt = new Date().toISOString();
      }
    });
    StorageService.saveRegistrations(registrations);

    this.render(container);
    this.showFeedback(container, `Event "${eventToDelete.title}" deleted.`, true);
  }

  private static openAttendeesModal(eventId: string, eventTitle: string): void {
    const modal = document.getElementById('attendees-modal');
    const modalTitle = document.getElementById('attendees-modal-title');
    const modalContent = document.getElementById('attendees-modal-content');

    if (modalTitle) modalTitle.textContent = `Registered Students — ${eventTitle}`;

    const registrations = StorageService.getRegistrations().filter(
      r => r.eventId === eventId && r.status === 'REGISTERED'
    );

    if (!modalContent) return;

    if (registrations.length === 0) {
      modalContent.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
          <p style="font-size: 2rem; margin-bottom: 0.5rem;">👥</p>
          <h4>No Registrations Yet</h4>
          <p style="font-size: 0.85rem;">No students have signed up for this event yet.</p>
        </div>
      `;
    } else {
      modalContent.innerHTML = `
        <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
          Showing <strong>${registrations.length}</strong> registered student(s):
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Email</th>
              <th>Pass ID</th>
              <th>Registered At</th>
            </tr>
          </thead>
          <tbody>
            ${registrations
              .map((r, i) => {
                const dateStr = new Date(r.registeredAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.studentName}</strong></td>
                  <td>${r.studentEmail}</td>
                  <td><code>${r.registrationId}</code></td>
                  <td>${dateStr}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      `;
    }

    const closeAttendeesModal = () => modal?.classList.add('hidden');
    document.getElementById('btn-close-attendees-modal')?.addEventListener('click', closeAttendeesModal);
    document.getElementById('btn-dismiss-attendees-modal')?.addEventListener('click', closeAttendeesModal);

    modal?.classList.remove('hidden');
  }

  private static showFeedback(container: HTMLElement, message: string, isSuccess: boolean): void {
    const banner = container.querySelector('#club-admin-feedback') as HTMLElement | null;
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
