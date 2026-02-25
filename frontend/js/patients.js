// ============================================
// Patients Module — Full CRUD management
// ============================================

let allPatients = [];
let editingPatientId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!API.requireAuth()) return;

    initSidebar();
    loadPatients();
    initModal();
    initSearch();
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

// ---- Data Loading ----
async function loadPatients() {
    const tableBody = document.getElementById('patientsTableBody');
    const countEl = document.getElementById('patientCount');

    try {
        showTableLoading(tableBody);
        const patients = await API.getPatients();
        allPatients = Array.isArray(patients) ? patients : [];
        if (countEl) countEl.textContent = allPatients.length;
        renderPatientTable(tableBody, allPatients);
    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <h4>Error loading patients</h4><p>${err.message}</p></div></td></tr>`;
    }
}

function renderPatientTable(container, patients) {
    if (!container) return;
    if (patients.length === 0) {
        container.innerHTML = `<tr><td colspan="6"><div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
      <h4>No patients found</h4><p>Click "Add New Patient" to register one.</p>
    </div></td></tr>`;
        return;
    }

    container.innerHTML = patients.map(p => {
        const initials = getInitials(p.name || p.email);
        return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="patient-avatar">${initials}</div>
          <div>
            <div class="patient-name">${escapeHtml(p.name || 'N/A')}</div>
            <div class="patient-email">${escapeHtml(p.email || '')}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(p.email || '')}</td>
      <td>${escapeHtml(p.address || '')}</td>
      <td>${p.dateOfBirth || ''}</td>
      <td>
        <div class="table-actions">
          <button class="table-action-btn" onclick="openEditModal('${p.id}')" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="table-action-btn danger" onclick="confirmDelete('${p.id}', '${escapeHtml(p.name)}')" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
    }).join('');
}

function showTableLoading(container) {
    container.innerHTML = `<tr><td colspan="6"><div class="spinner"></div></td></tr>`;
}

// ---- Search ----
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allPatients.filter(p =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.email || '').toLowerCase().includes(query) ||
            (p.address || '').toLowerCase().includes(query)
        );
        renderPatientTable(document.getElementById('patientsTableBody'), filtered);
    });
}

// ---- Modal ----
function initModal() {
    const overlay = document.getElementById('patientModal');
    const form = document.getElementById('patientForm');
    const closeBtn = document.getElementById('modalCloseBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    form?.addEventListener('submit', handleFormSubmit);

    document.getElementById('addPatientBtn')?.addEventListener('click', () => {
        openAddModal();
    });
}

function openAddModal() {
    editingPatientId = null;
    document.getElementById('modalTitle').textContent = 'Add New Patient';
    document.getElementById('patientForm').reset();
    document.getElementById('submitBtnText').textContent = 'Register Patient';
    document.getElementById('patientModal').classList.add('active');
}

function openEditModal(id) {
    const patient = allPatients.find(p => p.id === id);
    if (!patient) return;

    editingPatientId = id;
    document.getElementById('modalTitle').textContent = 'Edit Patient';
    document.getElementById('submitBtnText').textContent = 'Save Changes';

    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('patientEmail').value = patient.email || '';
    document.getElementById('patientAddress').value = patient.address || '';
    document.getElementById('patientDob').value = patient.dateOfBirth || '';

    document.getElementById('patientModal').classList.add('active');
}

function closeModal() {
    document.getElementById('patientModal').classList.remove('active');
    editingPatientId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
        name: document.getElementById('patientName').value.trim(),
        email: document.getElementById('patientEmail').value.trim(),
        address: document.getElementById('patientAddress').value.trim(),
        dateOfBirth: document.getElementById('patientDob').value,
        registeredDate: new Date().toISOString().split('T')[0]
    };

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;

    try {
        if (editingPatientId) {
            await API.updatePatient(editingPatientId, payload);
            showToast('Patient updated successfully.', 'success');
        } else {
            await API.createPatient(payload);
            showToast('Patient registered successfully.', 'success');
        }
        closeModal();
        await loadPatients();
    } catch (err) {
        showToast(err.message || 'Operation failed.', 'error');
    } finally {
        submitBtn.disabled = false;
    }
}

// ---- Delete ----
function confirmDelete(id, name) {
    if (confirm(`Are you sure you want to delete patient "${name}"? This action cannot be undone.`)) {
        performDelete(id);
    }
}

async function performDelete(id) {
    try {
        await API.deletePatient(id);
        showToast('Patient removed successfully.', 'success');
        await loadPatients();
    } catch (err) {
        showToast(err.message || 'Failed to delete patient.', 'error');
    }
}

// ---- Toast ----
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ---- Helpers ----
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}
