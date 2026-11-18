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

// ===== Auth Tab Switching =====
function switchAuthTab(tab) {
    document.querySelectorAll('#authSection .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#authSection .tab-content').forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        document.querySelectorAll('#authSection .tab')[0].classList.add('active');
        document.getElementById('loginTab').classList.add('active');
    } else {
        document.querySelectorAll('#authSection .tab')[1].classList.add('active');
        document.getElementById('registerTab').classList.add('active');
    }
}

// ===== Tab Switching (Dashboard) =====
function switchTab(tabName) {
    document.querySelectorAll('#studentDashboard .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#studentDashboard .tab-content').forEach(t => t.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');

    if (tabName === 'drives') loadEligibleDrives();
    if (tabName === 'applications') loadMyApplications();
    if (tabName === 'profile') loadProfile();
    if (tabName === 'notifications') loadNotifications();
}

// ===== Registration =====
async function register(e) {
    e.preventDefault();
    try {
        await api('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                roll_no: document.getElementById('regRoll').value,
                branch: document.getElementById('regBranch').value,
                year: parseInt(document.getElementById('regYear').value),
                cgpa: parseFloat(document.getElementById('regCGPA').value),
                phone: document.getElementById('regPhone').value,
                skills: document.getElementById('regSkills').value,
                backlogs: parseInt(document.getElementById('regBacklogs').value) || 0
            })
        });
        showToast('Registration successful! Please login.');
        switchAuthTab('login');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Login =====
async function login(e) {
    e.preventDefault();
    try {
        const data = await api('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            })
        });

        if (data.role !== 'student') {
            showToast('Please use the Admin login page', 'error');
            return;
        }

        showToast('Welcome, ' + data.name + '!');
        showDashboard(data.name);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Logout =====
async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    location.reload();
}

// ===== Show Dashboard =====
function showDashboard(name) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('studentDashboard').style.display = 'block';
    document.getElementById('userBadge').textContent = '👤 ' + name;
    document.getElementById('userBadge').style.display = 'inline';
    document.getElementById('logoutBtn').style.display = 'inline';
    loadEligibleDrives();
}

// ===== Load Eligible Drives =====
async function loadEligibleDrives() {
    try {
        const drives = await api('/api/students/eligible-drives');
        const container = document.getElementById('drivesList');

        if (drives.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>No eligible drives available right now. Check back soon!</p></div>';
            return;
        }

        container.innerHTML = drives.map(d => `
            <div class="drive-card">
                <div class="drive-header">
                    <div>
                        <h3>${d.job_title}</h3>
                        <div class="company">${d.company_name}</div>
                    </div>
                    <div class="package">₹${d.package_lpa} LPA</div>
                </div>
                ${d.job_description ? `<p style="color:var(--gray-500);font-size:0.9rem;margin-bottom:0.5rem;">${d.job_description}</p>` : ''}
                <div class="drive-meta">
                    <span>📅 Drive: ${new Date(d.drive_date).toLocaleDateString('en-IN')}</span>
                    <span>⏰ Apply by: ${new Date(d.last_date_apply).toLocaleDateString('en-IN')}</span>
                    <span>📊 Min CGPA: ${d.min_cgpa}</span>
                    <span>🎓 ${d.eligible_branches}</span>
                    <span>👥 ${d.total_applications} applied</span>
                </div>
                <div style="margin-top:1rem;">
                    ${d.already_applied
                        ? '<span class="badge badge-green">✅ Already Applied</span>'
                        : `<button class="btn btn-primary btn-sm" onclick="applyToDrive(${d.id})">Apply Now</button>`
                    }
                </div>
            </div>
        `).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Apply to Drive =====
async function applyToDrive(driveId) {
    try {
        await api('/api/applications', {
            method: 'POST',
            body: JSON.stringify({ drive_id: driveId })
        });
        showToast('Application submitted successfully!');
        loadEligibleDrives();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Load My Applications =====
async function loadMyApplications() {
    try {
        const apps = await api('/api/applications/my');
        const tbody = document.getElementById('applicationsTable');

        if (apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-500);padding:2rem;">No applications yet. Apply to a drive to get started!</td></tr>';
            return;
        }

        const statusBadge = (status) => {
            const colors = { applied: 'badge-blue', shortlisted: 'badge-orange', interviewed: 'badge-orange', selected: 'badge-green', rejected: 'badge-red' };
            return `<span class="badge ${colors[status] || 'badge-gray'}">${status.toUpperCase()}</span>`;
        };

        tbody.innerHTML = apps.map(a => `
            <tr>
                <td><strong>${a.company_name}</strong></td>
                <td>${a.job_title}</td>
                <td>₹${a.package_lpa}</td>
                <td>${new Date(a.drive_date).toLocaleDateString('en-IN')}</td>
                <td>${statusBadge(a.status)}</td>
            </tr>
        `).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Load Profile =====
async function loadProfile() {
    try {
        const p = await api('/api/students/profile');
        document.getElementById('profileInfo').innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1rem;padding:1rem;background:var(--gray-50);border-radius:var(--radius);">
                <div><strong>Name:</strong> ${p.name}</div>
                <div><strong>Email:</strong> ${p.email}</div>
                <div><strong>Roll No:</strong> ${p.roll_no}</div>
                <div><strong>Branch:</strong> ${p.branch}</div>
                <div><strong>Year:</strong> ${p.year}</div>
                <div><strong>CGPA:</strong> ${p.cgpa}</div>
            </div>
        `;
        document.getElementById('profilePhone').value = p.phone || '';
        document.getElementById('profileSkills').value = p.skills || '';
        document.getElementById('profileResume').value = p.resume_link || '';
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Update Profile =====
async function updateProfile(e) {
    e.preventDefault();
    try {
        await api('/api/students/profile', {
            method: 'PUT',
            body: JSON.stringify({
                phone: document.getElementById('profilePhone').value,
                skills: document.getElementById('profileSkills').value,
                resume_link: document.getElementById('profileResume').value
            })
        });
        showToast('Profile updated successfully!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Load Notifications =====
async function loadNotifications() {
    try {
        const notifs = await api('/api/dashboard/notifications');
        const container = document.getElementById('notificationsList');

        if (notifs.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="icon">🔕</div><p>No notifications yet.</p></div>';
            return;
        }

        container.innerHTML = notifs.map(n => `
            <div class="notification-item">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <span class="time">${new Date(n.created_at).toLocaleString('en-IN')}</span>
            </div>
        `).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ===== Check Session on Load =====
(async () => {
    try {
        const user = await api('/api/auth/me');
        if (user.role === 'student') {
            showDashboard(user.name);
        }
    } catch (e) {
        // Not logged in, show login form
    }
})();
