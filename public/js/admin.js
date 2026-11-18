// ===== Utility Functions =====
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function api(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

let allStudents = [];
let allDrives = [];

// ===== Modal =====
function showModal(id) {
    document.getElementById(id).classList.add('active');
    if (id === 'driveModal') loadCompaniesForSelect();
}
function hideModal(id) { document.getElementById(id).classList.remove('active'); }

// ===== Tab Switching =====
function switchTab(tabName) {
    document.querySelectorAll('#adminDashboard .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#adminDashboard .tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');

    if (tabName === 'drives') loadDrives();
    if (tabName === 'companies') loadCompanies();
    if (tabName === 'students') loadStudents();
    if (tabName === 'applications') loadDrivesForSelect();
    if (tabName === 'notifications') loadNotifications();
}

// ===== Admin Login =====
async function adminLoginSubmit(e) {
    e.preventDefault();
    try {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('adminEmail').value,
                password: document.getElementById('adminPassword').value
            })
        });

        if (data.role !== 'admin') {
            showToast('Access denied. Admin only.', 'error');
            return;
        }

        showToast('Welcome, Admin!');
        showAdminDashboard(data.name);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    location.reload();
}

function showAdminDashboard(name) {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('userBadge').textContent = '👤 ' + name;
    document.getElementById('userBadge').style.display = 'inline';
    document.getElementById('logoutBtn').style.display = 'inline';
    loadStats();
    loadDrives();
}

// ===== Load Stats =====
async function loadStats() {
    try {
        const stats = await api('/api/dashboard/stats');
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${stats.totalStudents}</div>
                <div class="stat-label">Registered Students</div>
            </div>
            <div class="stat-card green">
                <div class="stat-number">${stats.totalCompanies}</div>
                <div class="stat-label">Companies</div>
            </div>
            <div class="stat-card orange">
                <div class="stat-number">${stats.totalDrives}</div>
                <div class="stat-label">Total Drives</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.upcomingDrives}</div>
                <div class="stat-label">Upcoming Drives</div>
            </div>
            <div class="stat-card green">
                <div class="stat-number">${stats.totalApplications}</div>
                <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card red">
                <div class="stat-number">${stats.totalSelected}</div>
                <div class="stat-label">Students Selected</div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Companies =====
async function loadCompanies() {
    try {
        const companies = await api('/api/companies');
        document.getElementById('companiesTable').innerHTML = companies.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.industry || '-'}</td>
                <td>${c.website ? `<a href="${c.website}" target="_blank">${c.website}</a>` : '-'}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteCompany(${c.id})">Delete</button></td>
            </tr>
        `).join('');
    } catch (err) { showToast(err.message, 'error'); }
}

async function addCompany(e) {
    e.preventDefault();
    try {
        await api('/api/companies', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('compName').value,
                industry: document.getElementById('compIndustry').value,
                website: document.getElementById('compWebsite').value,
                description: document.getElementById('compDesc').value
            })
        });
        showToast('Company added!');
        hideModal('companyModal');
        loadCompanies();
        loadStats();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteCompany(id) {
    if (!confirm('Delete this company?')) return;
    try {
        await api('/api/companies/' + id, { method: 'DELETE' });
        showToast('Company deleted');
        loadCompanies();
        loadStats();
    } catch (err) { showToast(err.message, 'error'); }
}

// ===== Drives =====
async function loadDrives() {
    try {
        allDrives = await api('/api/drives');
        const statusBadge = (s) => {
            const c = { upcoming: 'badge-blue', ongoing: 'badge-orange', completed: 'badge-green' };
            return `<span class="badge ${c[s]}">${s.toUpperCase()}</span>`;
        };
        document.getElementById('drivesTable').innerHTML = allDrives.map(d => `
            <tr>
                <td><strong>${d.company_name}</strong></td>
                <td>${d.job_title}</td>
                <td>₹${d.package_lpa} LPA</td>
                <td>${d.min_cgpa}</td>
                <td>${d.eligible_branches}</td>
                <td>${new Date(d.drive_date).toLocaleDateString('en-IN')}</td>
                <td>${statusBadge(d.status)}</td>
                <td>${d.total_applications}</td>
                <td>
                    <select onchange="updateDriveStatus(${d.id}, this.value)" style="padding:0.2rem;border-radius:4px;border:1px solid var(--gray-300);">
                        <option value="upcoming" ${d.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                        <option value="ongoing" ${d.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                        <option value="completed" ${d.status === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                    <button class="btn btn-danger btn-sm" onclick="deleteDrive(${d.id})" style="margin-left:0.3rem;">✕</button>
                </td>
            </tr>
        `).join('');
    } catch (err) { showToast(err.message, 'error'); }
}

async function loadCompaniesForSelect() {
    const companies = await api('/api/companies');
    document.getElementById('driveCompany').innerHTML = companies.map(c =>
        `<option value="${c.id}">${c.name}</option>`
    ).join('');
}

async function createDrive(e) {
    e.preventDefault();
    try {
        await api('/api/drives', {
            method: 'POST',
            body: JSON.stringify({
                company_id: document.getElementById('driveCompany').value,
                job_title: document.getElementById('driveTitle').value,
                job_description: document.getElementById('driveDesc').value,
                package_lpa: parseFloat(document.getElementById('drivePackage').value),
                min_cgpa: parseFloat(document.getElementById('driveCGPA').value),
                max_backlogs: parseInt(document.getElementById('driveBacklogs').value),
                eligible_branches: document.getElementById('driveBranches').value,
                drive_date: document.getElementById('driveDate').value,
                last_date_apply: document.getElementById('driveLastDate').value
            })
        });
        showToast('Drive created successfully!');
        hideModal('driveModal');
        loadDrives();
        loadStats();
    } catch (err) { showToast(err.message, 'error'); }
}

async function updateDriveStatus(id, status) {
    try {
        await api('/api/drives/' + id + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast('Status updated');
        loadStats();
    } catch (err) { showToast(err.message, 'error'); }
}

async function deleteDrive(id) {
    if (!confirm('Delete this drive and all its applications?')) return;
    try {
        await api('/api/drives/' + id, { method: 'DELETE' });
        showToast('Drive deleted');
        loadDrives();
        loadStats();
    } catch (err) { showToast(err.message, 'error'); }
}

// ===== Students =====
async function loadStudents() {
    try {
        allStudents = await api('/api/students');
        renderStudents(allStudents);
    } catch (err) { showToast(err.message, 'error'); }
}

function renderStudents(students) {
    document.getElementById('studentsTable').innerHTML = students.map(s => `
        <tr>
            <td>${s.roll_no}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.branch}</td>
            <td>${s.year}</td>
            <td>${s.cgpa}</td>
            <td>${s.backlogs}</td>
            <td>${s.phone || '-'}</td>
            <td>${s.skills || '-'}</td>
        </tr>
    `).join('');
}

function filterStudents() {
    const query = document.getElementById('studentSearch').value.toLowerCase();
    const filtered = allStudents.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.roll_no.toLowerCase().includes(query) ||
        s.branch.toLowerCase().includes(query) ||
        (s.skills || '').toLowerCase().includes(query)
    );
    renderStudents(filtered);
}

// ===== Applications =====
async function loadDrivesForSelect() {
    try {
        const drives = await api('/api/drives');
        document.getElementById('driveSelect').innerHTML =
            '<option value="">-- Select a Drive --</option>' +
            drives.map(d => `<option value="${d.id}">${d.company_name} - ${d.job_title} (${new Date(d.drive_date).toLocaleDateString('en-IN')})</option>`).join('');
    } catch (err) { showToast(err.message, 'error'); }
}

async function loadDriveApplications() {
    const driveId = document.getElementById('driveSelect').value;
    if (!driveId) {
        document.getElementById('driveAppsTable').innerHTML = '';
        return;
    }

    try {
        const apps = await api('/api/applications/drive/' + driveId);
        if (apps.length === 0) {
            document.getElementById('driveAppsTable').innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-500);">No applications for this drive yet.</td></tr>';
            return;
        }

        document.getElementById('driveAppsTable').innerHTML = apps.map(a => `
            <tr>
                <td>${a.roll_no}</td>
                <td><strong>${a.student_name}</strong></td>
                <td>${a.branch}</td>
                <td>${a.cgpa}</td>
                <td>${a.phone || '-'}</td>
                <td>${a.skills || '-'}</td>
                <td><span class="badge badge-${a.status === 'selected' ? 'green' : a.status === 'rejected' ? 'red' : 'blue'}">${a.status.toUpperCase()}</span></td>
                <td>
                    <select onchange="updateAppStatus(${a.id}, this.value)" style="padding:0.2rem;border-radius:4px;border:1px solid var(--gray-300);">
                        <option value="applied" ${a.status === 'applied' ? 'selected' : ''}>Applied</option>
                        <option value="shortlisted" ${a.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
                        <option value="interviewed" ${a.status === 'interviewed' ? 'selected' : ''}>Interviewed</option>
                        <option value="selected" ${a.status === 'selected' ? 'selected' : ''}>Selected</option>
                        <option value="rejected" ${a.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
            </tr>
        `).join('');
    } catch (err) { showToast(err.message, 'error'); }
}

async function updateAppStatus(id, status) {
    try {
        await api('/api/applications/' + id + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast('Application status updated');
        loadDriveApplications();
        loadStats();
    } catch (err) { showToast(err.message, 'error'); }
}

// ===== Notifications =====
async function loadNotifications() {
    try {
        const notifs = await api('/api/dashboard/notifications');
        document.getElementById('notifList').innerHTML = notifs.length === 0
            ? '<p style="color:var(--gray-500);">No notifications yet.</p>'
            : notifs.map(n => `
                <div class="notification-item">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <span class="time">${new Date(n.created_at).toLocaleString('en-IN')}</span>
                </div>
            `).join('');
    } catch (err) { showToast(err.message, 'error'); }
}

async function postNotification(e) {
    e.preventDefault();
    try {
        await api('/api/dashboard/notifications', {
            method: 'POST',
            body: JSON.stringify({
                title: document.getElementById('notifTitle').value,
                message: document.getElementById('notifMessage').value
            })
        });
        showToast('Notification posted!');
        document.getElementById('notifTitle').value = '';
        document.getElementById('notifMessage').value = '';
        loadNotifications();
    } catch (err) { showToast(err.message, 'error'); }
}

// ===== Check Session =====
(async () => {
    try {
        const user = await api('/api/auth/me');
        if (user.role === 'admin') {
            showAdminDashboard(user.name);
        }
    } catch (e) {
        // Not logged in
    }
})();
