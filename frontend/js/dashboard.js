// ============================================
// Dashboard Module
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!API.requireAuth()) return;

    initSidebar();
    loadDashboardData();
    checkSystemStatus();
});

function initSidebar() {
    const user = API.getUser();
    const emailEl = document.getElementById('userEmail');
    const avatarEl = document.getElementById('userAvatar');
    if (emailEl && user) emailEl.textContent = user.email;
    if (avatarEl && user) avatarEl.textContent = user.email.charAt(0).toUpperCase();

    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        API.logout();
    });
}

async function loadDashboardData() {
    const listEl = document.getElementById('recentPatientsList');
    const totalEl = document.getElementById('totalPatients');
    const activeEl = document.getElementById('activeRecords');
    const monthEl = document.getElementById('thisMonth');

    try {
        const patients = await API.getPatients();
        const arr = Array.isArray(patients) ? patients : [];

        // Stats
        if (totalEl) totalEl.textContent = arr.length;
        if (activeEl) activeEl.textContent = arr.length;

        // This month count
        const now = new Date();
        const thisMonthCount = arr.filter(p => {
            if (!p.dateOfBirth) return false;
            try {
                const d = new Date(p.dateOfBirth);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            } catch { return false; }
        }).length;
        if (monthEl) monthEl.textContent = thisMonthCount;

        // Recent patients (last 5)
        renderRecentPatients(listEl, arr.slice(-5).reverse());
    } catch (err) {
        if (listEl) {
            listEl.innerHTML = `<div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
        <h4>Unable to load data</h4>
        <p>${err.message}</p>
      </div>`;
        }
    }
}

function renderRecentPatients(container, patients) {
    if (!container) return;
    if (patients.length === 0) {
        container.innerHTML = `<div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
      <h4>No patients yet</h4>
      <p>Register a new patient to get started.</p>
    </div>`;
        return;
    }

    const colors = ['', 'yellow', '', 'yellow', ''];
    container.innerHTML = patients.map((p, i) => {
        const initials = getInitials(p.name || p.email);
        const cls = colors[i % colors.length];
        return `<li class="patient-item">
      <div class="patient-avatar ${cls}">${initials}</div>
      <div class="patient-details">
        <div class="patient-name">${escapeHtml(p.name || 'N/A')}</div>
        <div class="patient-email">${escapeHtml(p.email || '')}</div>
      </div>
      <div class="patient-date">${p.dateOfBirth || ''}</div>
    </li>`;
    }).join('');
}

async function checkSystemStatus() {
    const services = [
        { name: 'API Gateway', url: `${API.BASE_URL}/` },
        { name: 'Auth Service', url: `${API.BASE_URL}/auth/validate` },
        { name: 'Patient Service', url: `${API.BASE_URL}/api/patients/` },
    ];

    const container = document.getElementById('systemStatus');
    if (!container) return;

    const results = await Promise.all(
        services.map(s => API.checkServiceHealth(s.name, s.url))
    );

    container.innerHTML = results.map(r => `
    <div class="status-item">
      <span class="status-name">${r.name}</span>
      <span class="status-badge ${r.status}">
        <span class="status-dot ${r.status}"></span>
        ${r.status === 'online' ? 'Online' : 'Offline'}
      </span>
    </div>
  `).join('');
}

// Helpers
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
