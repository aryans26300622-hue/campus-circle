/**
 * @file clubDiscovery.ts
 * @description Implements HLD Module 1: Club Discovery.
 * Handles student browsing, keyword search, category filtering, and joining clubs.
 */

import { StorageService } from '../../storage/storageService';
import { SessionService } from '../../auth/session';

export class ClubDiscoveryModule {
  private static searchTerm: string = '';
  private static selectedCategory: string = 'All';

  /**
   * Renders the Club Discovery view into the target container.
   */
  public static render(container: HTMLElement): void {
    container.innerHTML = `
      <section class="section-container">
        <div class="section-header">
          <div>
            <h1 class="page-title">Discover Campus Clubs</h1>
            <p class="page-subtitle">Find communities that match your passions, join clubs, and collaborate.</p>
          </div>
        </div>

        <!-- Search and Filter Bar -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              id="club-search-input" 
              placeholder="Search clubs by name or keywords..." 
              value="${this.searchTerm}" 
            />
          </div>

          <div class="category-pills" id="club-category-pills">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <!-- Clubs Grid -->
        <div id="clubs-grid" class="cards-grid">
          <!-- Club cards rendered here -->
        </div>
      </section>
    `;

    this.renderCategoryPills();
    this.renderClubsList();
    this.attachEvents();
  }

  private static getCategories(): string[] {
    const clubs = StorageService.getClubs().filter(c => c.status === 'approved');
    const categories = new Set<string>(clubs.map(c => c.category));
    return ['All', ...Array.from(categories)];
  }

  private static renderCategoryPills(): void {
    const pillsContainer = document.getElementById('club-category-pills');
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

  private static renderClubsList(): void {
    const grid = document.getElementById('clubs-grid');
    if (!grid) return;

    const currentUser = SessionService.getCurrentUser();
    // Only approved clubs are visible in public discovery (pending clubs are reviewed by admin)
    const allApprovedClubs = StorageService.getClubs().filter(c => c.status === 'approved');

    const filtered = allApprovedClubs.filter(club => {
      const matchesSearch =
        club.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        club.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCat =
        this.selectedCategory === 'All' || club.category === this.selectedCategory;
      return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p class="empty-icon">🔎</p>
          <h3>No clubs found</h3>
          <p>Try adjusting your search terms or filter criteria.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(club => {
        const isJoined = currentUser.joinedClubIds?.includes(club.id);
        const isStudent = currentUser.role === 'student';

        return `
        <article class="card club-card">
          <div class="card-image-wrap">
            <img src="${club.imageUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80'}" alt="${club.name}" class="card-img" />
            <span class="badge category-badge">${club.category}</span>
          </div>

          <div class="card-body">
            <h3 class="card-title">${club.name}</h3>
            <p class="card-desc">${club.description}</p>
            
            <div class="club-meta">
              <span class="meta-item">
                👥 <strong>${club.memberCount}</strong> members
              </span>
              <span class="meta-item">
                👤 Lead: <strong>${club.leadName}</strong>
              </span>
            </div>
          </div>

          <div class="card-footer">
            <a href="mailto:${club.contactEmail}" class="btn btn-outline btn-sm">Contact</a>
            ${
              isStudent
                ? `
                <button 
                  class="btn ${isJoined ? 'btn-secondary' : 'btn-primary'} btn-sm btn-join-club" 
                  data-club-id="${club.id}">
                  ${isJoined ? '✓ Joined' : '+ Join Club'}
                </button>
              `
                : ''
            }
          </div>
        </article>
      `;
      })
      .join('');
  }

  private static attachEvents(): void {
    const searchInput = document.getElementById('club-search-input') as HTMLInputElement | null;
    searchInput?.addEventListener('input', e => {
      this.searchTerm = (e.target as HTMLInputElement).value;
      this.renderClubsList();
    });

    const pillsContainer = document.getElementById('club-category-pills');
    pillsContainer?.addEventListener('click', e => {
      const target = (e.target as HTMLElement).closest('.pill-btn') as HTMLButtonElement | null;
      if (!target) return;
      this.selectedCategory = target.dataset.category || 'All';
      this.renderCategoryPills();
      this.renderClubsList();
    });

    const grid = document.getElementById('clubs-grid');
    grid?.addEventListener('click', e => {
      const button = (e.target as HTMLElement).closest('.btn-join-club') as HTMLButtonElement | null;
      if (!button) return;

      const clubId = button.dataset.clubId;
      if (!clubId) return;

      this.toggleClubMembership(clubId);
    });
  }

  /**
   * Toggles the current student's membership in the specified club.
   */
  private static toggleClubMembership(clubId: string): void {
    const currentUser = SessionService.getCurrentUser();
    if (currentUser.role !== 'student') return;

    const users = StorageService.getUsers();
    const clubs = StorageService.getClubs();

    const targetUser = users.find(u => u.id === currentUser.id);
    const targetClub = clubs.find(c => c.id === clubId);

    if (!targetUser || !targetClub) return;

    if (!targetUser.joinedClubIds) {
      targetUser.joinedClubIds = [];
    }

    const alreadyJoined = targetUser.joinedClubIds.includes(clubId);

    if (alreadyJoined) {
      // Leave club
      targetUser.joinedClubIds = targetUser.joinedClubIds.filter(id => id !== clubId);
      targetClub.memberCount = Math.max(0, targetClub.memberCount - 1);
    } else {
      // Join club
      targetUser.joinedClubIds.push(clubId);
      targetClub.memberCount += 1;
    }

    StorageService.saveUsers(users);
    StorageService.saveClubs(clubs);
    this.renderClubsList();
  }
}
