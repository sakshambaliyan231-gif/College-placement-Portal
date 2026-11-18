const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Dashboard statistics (admin)
router.get('/stats', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const db = getDb();

    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalCompanies = db.prepare('SELECT COUNT(*) as count FROM companies').get().count;
    const totalDrives = db.prepare('SELECT COUNT(*) as count FROM drives').get().count;
    const upcomingDrives = db.prepare("SELECT COUNT(*) as count FROM drives WHERE status = 'upcoming'").get().count;
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const totalSelected = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'selected'").get().count;

    // Branch-wise student count
    const branchWise = db.prepare(`
        SELECT branch, COUNT(*) as count FROM student_profiles GROUP BY branch ORDER BY count DESC
    `).all();

    // Recent applications
    const recentApplications = db.prepare(`
        SELECT a.status, u.name as student_name, sp.branch, d.job_title, c.name as company_name, a.applied_at
        FROM applications a
        JOIN users u ON a.student_id = u.id
        JOIN student_profiles sp ON u.id = sp.user_id
        JOIN drives d ON a.drive_id = d.id
        JOIN companies c ON d.company_id = c.id
        ORDER BY a.applied_at DESC LIMIT 10
    `).all();

    // Package statistics
    const avgPackage = db.prepare(`
        SELECT AVG(d.package_lpa) as avg_package, MAX(d.package_lpa) as max_package, MIN(d.package_lpa) as min_package
        FROM drives d
    `).get();

    res.json({
        totalStudents,
        totalCompanies,
        totalDrives,
        upcomingDrives,
        totalApplications,
        totalSelected,
        branchWise,
        recentApplications,
        avgPackage
    });
});

// Notifications
router.get('/notifications', (req, res) => {
    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20').all();
    res.json(notifications);
});

// Post notification (admin)
router.post('/notifications', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { title, message } = req.body;
    const db = getDb();
    db.prepare('INSERT INTO notifications (title, message) VALUES (?, ?)').run(title, message);
    res.json({ message: 'Notification posted' });
});

module.exports = router;
