const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all students (admin only)
router.get('/', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const db = getDb();
    const students = db.prepare(`
        SELECT u.id, u.name, u.email, sp.roll_no, sp.branch, sp.year, sp.cgpa, sp.phone, sp.skills, sp.backlogs, sp.resume_link
        FROM users u
        JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.role = 'student'
        ORDER BY sp.branch, sp.roll_no
    `).all();

    res.json(students);
});

// Get student profile
router.get('/profile', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

    const db = getDb();
    const profile = db.prepare(`
        SELECT u.id, u.name, u.email, sp.roll_no, sp.branch, sp.year, sp.cgpa, sp.phone, sp.skills, sp.backlogs, sp.resume_link
        FROM users u
        JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = ?
    `).get(req.session.userId);

    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
});

// Update student profile
router.put('/profile', (req, res) => {
    if (!req.session.userId || req.session.role !== 'student') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { phone, skills, resume_link } = req.body;
    const db = getDb();

    db.prepare('UPDATE student_profiles SET phone = ?, skills = ?, resume_link = ? WHERE user_id = ?')
        .run(phone, skills, resume_link, req.session.userId);

    res.json({ message: 'Profile updated successfully' });
});

// Get eligible drives for a student
router.get('/eligible-drives', (req, res) => {
    if (!req.session.userId || req.session.role !== 'student') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = getDb();
    const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(req.session.userId);

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const drives = db.prepare(`
        SELECT d.*, c.name as company_name, c.industry,
        (SELECT COUNT(*) FROM applications WHERE drive_id = d.id) as total_applications,
        (SELECT id FROM applications WHERE drive_id = d.id AND student_id = ?) as already_applied
        FROM drives d
        JOIN companies c ON d.company_id = c.id
        WHERE d.min_cgpa <= ?
        AND d.max_backlogs >= ?
        AND d.eligible_branches LIKE ?
        AND d.last_date_apply >= date('now')
        ORDER BY d.drive_date ASC
    `).all(req.session.userId, profile.cgpa, profile.backlogs, `%${profile.branch}%`);

    res.json(drives);
});

module.exports = router;
