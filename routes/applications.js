const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Apply to a drive (student only)
router.post('/', (req, res) => {
    if (!req.session.userId || req.session.role !== 'student') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const { drive_id } = req.body;
    const db = getDb();

    try {
        // Check eligibility
        const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(req.session.userId);
        const drive = db.prepare('SELECT * FROM drives WHERE id = ?').get(drive_id);

        if (!drive) return res.status(404).json({ error: 'Drive not found' });
        if (profile.cgpa < drive.min_cgpa) return res.status(400).json({ error: `Minimum CGPA required: ${drive.min_cgpa}` });
        if (profile.backlogs > drive.max_backlogs) return res.status(400).json({ error: 'Too many backlogs for this drive' });
        if (!drive.eligible_branches.includes(profile.branch)) {
            return res.status(400).json({ error: 'Your branch is not eligible for this drive' });
        }

        db.prepare('INSERT INTO applications (student_id, drive_id) VALUES (?, ?)').run(req.session.userId, drive_id);
        res.json({ message: 'Application submitted successfully!' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'You have already applied to this drive' });
        }
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

// Get student's applications
router.get('/my', (req, res) => {
    if (!req.session.userId || req.session.role !== 'student') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const db = getDb();
    const applications = db.prepare(`
        SELECT a.*, d.job_title, d.package_lpa, d.drive_date, d.status as drive_status, c.name as company_name
        FROM applications a
        JOIN drives d ON a.drive_id = d.id
        JOIN companies c ON d.company_id = c.id
        WHERE a.student_id = ?
        ORDER BY a.applied_at DESC
    `).all(req.session.userId);

    res.json(applications);
});

// Get applications for a drive (admin only)
router.get('/drive/:driveId', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const db = getDb();
    const applications = db.prepare(`
        SELECT a.*, u.name as student_name, u.email, sp.roll_no, sp.branch, sp.cgpa, sp.phone, sp.skills
        FROM applications a
        JOIN users u ON a.student_id = u.id
        JOIN student_profiles sp ON u.id = sp.user_id
        WHERE a.drive_id = ?
        ORDER BY sp.cgpa DESC
    `).all(req.params.driveId);

    res.json(applications);
});

// Update application status (admin only)
router.put('/:id/status', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { status } = req.body;
    const db = getDb();
    db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Application status updated' });
});

module.exports = router;
