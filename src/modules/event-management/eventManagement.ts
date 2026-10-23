/**
 * @file eventManagement.ts
 * @description Implements HLD Module 3: Event Management.
 * Provides student event browsing, search, filtering, and direct event registration actions.
 */

import { StorageService } from '../../storage/storageService';
import { SessionService } from '../../auth/session';
import { ParticipationModule } from '../participation/participation';

export class EventManagementModule {
  private static searchTerm: string = '';
  private static selectedCategory: string = 'All';
  private static selectedDateFilter: string = 'all';
  private static customDate: string = '';

  /**
   * Callback to navigate to "My Registrations" tab when requested.
   */
  public static onNavigateToRegistrations?: () => void;

  /**
   * Renders the Student Events Feed into the target container.
   */
  public static renderFeed(container: HTMLElement): void {
    container.innerHTML = `
      <section class="section-container">
        <div class="section-header">
          <div>
            <h1 class="page-title">Campus Events Feed</h1>
            <p class="page-subtitle">Explore workshops, hackathons, guest lectures, and campus socials.</p>
          </div>
        </div>

        <!-- Feedback Alert Toast Banner -->
        <div id="event-feed-feedback" class="feedback-banner hidden"></div>

        <!-- Filter and Search Toolbar -->
        <div class="filter-bar event-filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="event-search-input" 
              placeholder="Search events by title, club, or keywords..." 
              value="${this.searchTerm}" 
            />
          </div>

          <div class="date-filter-group">
            <label for="event-date-filter" class="filter-label">Date:</label>
            <select id="event-date-filter" class="filter-dropdown">
              <option value="all" ${this.selectedDateFilter === 'all' ? 'selected' : ''}>All Upcoming</option>
              <option value="this_week" ${this.selectedDateFilter === 'this_week' ? 'selected' : ''}>Next 7 Days</option>
              <option value="this_month" ${this.selectedDateFilter === 'this_month' ? 'selected' : ''}>Next 30 Days</option>
              <option value="custom" ${this.selectedDateFilter === 'custom' ? 'selected' : ''}>Specific Date</option>
            </select>

            <input 
              type="date" 
              id="event-custom-date" 
              class="date-input ${this.selectedDateFilter === 'custom' ? '' : 'hidden'}" 
              value="${this.customDate}" 
            />
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="category-pills" id="event-category-pills">
          <!-- Rendered dynamically -->
        </div>

        <!-- Events Grid -->
        <div id="events-grid" class="cards-grid">
          <!-- Event cards rendered here -->
        </div>
      </section>
    `;

    this.renderCategoryPills();
    this.renderEventsList();
    this.attachEvents();
  }

  private static getCategories(): string[] {
    const events = StorageService.getEvents();
    const categories = new Set<string>(events.map(e => e.category));
    return ['All', ...Array.from(categories)];
  }

  private static renderCategoryPills(): void {
    const pillsContainer = document.getElementById('event-category-pills');
    if (!pillsContainer) return;

    const categories = this.getCategories();
    pillsContainer.innerHTML = categories
      .map(
        cat => `
        <button 
          class="pill-btn ${this.selectedCategory === cat ? 'active' : ''}" 
          data-category="${cat}">
          ${cat}
        </button>
      `
      )
      .join('');
  }

  private static renderEventsList(): void {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    const currentUser = SessionService.getCurrentUser();
    const registrations = StorageService.getRegistrations();
    const allEvents = StorageService.getEvents();

    // Filter events
    const filtered = allEvents.filter(event => {
      const matchesSearch =
        event.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        event.clubName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory =
        this.selectedCategory === 'All' || event.category === this.selectedCategory;

      const matchesDate = this.checkDateMatch(event.date);

      return matchesSearch && matchesCategory && matchesDate;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">📅</p>
          <h3>No events match your criteria</h3>
          <p>Try clearing filters or searching for different keywords.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(event => {
        const isRegistered = registrations.some(
          r =>
            r.eventId === event.id &&
            r.studentId === currentUser.id &&
            r.status === 'REGISTERED'
        );
        const isFull = event.registeredCount >= event.capacity;
        const spotsLeft = Math.max(0, event.capacity - event.registeredCount);
        const isStudent = currentUser.role === 'student';

        return `
        <article class="card event-card">
          <div class="card-image-wrap">
            <img 
              src="${event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80'}" 
              alt="${event.title}" 
              class="card-img" 
            />
            <span class="badge category-badge">${event.category}</span>
            <span class="badge ${isFull ? 'badge-danger' : 'badge-success'} capacity-badge">
              ${isFull ? 'Event Full' : `${spotsLeft} seats left`}
            </span>
          </div>

          <div class="card-body">
            <div class="event-host">Hosted by <strong>${event.clubName}</strong></div>
            <h3 class="card-title">${event.title}</h3>
            <p class="card-desc">${event.description}</p>
            
            <div class="event-details">
              <div class="detail-row">
                <span class="detail-icon">📅</span>
                <span>${this.formatEventDate(event.date)} at ${event.time}</span>
              </div>
              <div class="detail-row">
                <span class="detail-icon">📍</span>
                <span>${event.location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-icon">🎟️</span>
                <span>${event.registeredCount} / ${event.capacity} registered</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            ${
              isRegistered
                ? `<span class="badge badge-registered">✓ You are registered</span>`
                : isFull
                ? `<span class="badge badge-full-warning">Fully Booked</span>`
                : `<span class="badge badge-open">Open Seats Available</span>`
            }

            ${
              isStudent
                ? isRegistered
                  ? `
                  <button 
                    class="btn btn-secondary btn-sm btn-cancel-event-inline" 
                    data-event-id="${event.id}" 
                    data-event-title="${event.title}">
                    Unregister
                  </button>
                `
                  : isFull
                  ? `
                  <button class="btn btn-outline btn-sm" disabled style="opacity: 0.6; cursor: not-allowed;">
                    Full
                  </button>
                `
                  : `
                  <button 
                    class="btn btn-primary btn-sm btn-register-event" 
                    data-event-id="${event.id}">
                    Register Now
                  </button>
                `
                : `
                <span style="font-size: 0.8rem; color: var(--text-muted);">
                  (${currentUser.role.replace('_', ' ')})
                </span>
              `
            }
          </div>
        </article>
      `;
      })
      .join('');
  }

  private static checkDateMatch(eventDateStr: string): boolean {
    if (this.selectedDateFilter === 'all') return true;

    const eventDate = new Date(eventDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.selectedDateFilter === 'this_week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate <= nextWeek;
    }

    if (this.selectedDateFilter === 'this_month') {
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 30);
      return eventDate >= today && eventDate <= nextMonth;
    }

    if (this.selectedDateFilter === 'custom' && this.customDate) {
      return eventDateStr === this.customDate;
    }

    return true;
  }

  private static formatEventDate(dateStr: string): string {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      // Fallback
    }
    return dateStr;
  }

  private static attachEvents(): void {
    const searchInput = document.getElementById('event-search-input') as HTMLInputElement | null;
    searchInput?.addEventListener('input', e => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.renderEventsList();
    });

    const dateFilter = document.getElementById('event-date-filter') as HTMLSelectElement | null;
    const customDateInput = document.getElementById('event-custom-date') as HTMLInputElement | null;

    dateFilter?.addEventListener('change', e => {
      this.selectedDateFilter = (e.target as HTMLSelectElement).value;
      if (this.selectedDateFilter === 'custom') {
        customDateInput?.classList.remove('hidden');
      } else {
        customDateInput?.classList.add('hidden');
      }
      this.renderEventsList();
    });

    customDateInput?.addEventListener('change', e => {
      this.customDate = (e.target as HTMLInputElement).value;
      this.renderEventsList();
    });

    const pillsContainer = document.getElementById('event-category-pills');
    pillsContainer?.addEventListener('click', e => {
      const target = (e.target as HTMLElement).closest('.pill-btn') as HTMLButtonElement | null;
      if (!target) return;
      this.selectedCategory = target.dataset.category || 'All';
      this.renderCategoryPills();
      this.renderEventsList();
    });

    const grid = document.getElementById('events-grid');
    grid?.addEventListener('click', e => {
      const target = e.target as HTMLElement;

      // Handle Register click
      const registerBtn = target.closest('.btn-register-event') as HTMLButtonElement | null;
      if (registerBtn) {
        const eventId = registerBtn.dataset.eventId;
        if (!eventId) return;

        const currentUser = SessionService.getCurrentUser();
        const result = ParticipationModule.register(currentUser.id, eventId);

        this.showFeedback(result.message, result.success);
        this.renderEventsList();
        return;
      }

      // Handle Unregister click
      const cancelBtn = target.closest('.btn-cancel-event-inline') as HTMLButtonElement | null;
      if (cancelBtn) {
        const eventId = cancelBtn.dataset.eventId;
        const eventTitle = cancelBtn.dataset.eventTitle;
        if (!eventId) return;

        const confirmed = window.confirm(`Unregister from "${eventTitle}"?`);
        if (confirmed) {
          const currentUser = SessionService.getCurrentUser();
          const result = ParticipationModule.cancelRegistration(currentUser.id, eventId);
          this.showFeedback(result.message, result.success);
          this.renderEventsList();
        }
      }
    });
  }

  private static showFeedback(message: string, isSuccess: boolean): void {
    const banner = document.getElementById('event-feed-feedback');
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
