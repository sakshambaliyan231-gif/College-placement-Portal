const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all drives
router.get('/', (req, res) => {
    const db = getDb();
    const drives = db.prepare(`
        SELECT d.*, c.name as company_name, c.industry,
        (SELECT COUNT(*) FROM applications WHERE drive_id = d.id) as total_applications
        FROM drives d
        JOIN companies c ON d.company_id = c.id
        ORDER BY d.drive_date DESC
    `).all();
    res.json(drives);
});

// Create drive (admin only)
router.post('/', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { company_id, job_title, job_description, package_lpa, min_cgpa, max_backlogs, eligible_branches, drive_date, last_date_apply } = req.body;
    const db = getDb();

    try {
        db.prepare(`
            INSERT INTO drives (company_id, job_title, job_description, package_lpa, min_cgpa, max_backlogs, eligible_branches, drive_date, last_date_apply)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(company_id, job_title, job_description || '', package_lpa, min_cgpa || 0, max_backlogs || 0, eligible_branches, drive_date, last_date_apply);

        res.json({ message: 'Placement drive created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create drive' });
    }
});

// Update drive status (admin only)
router.put('/:id/status', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { status } = req.body;
    const db = getDb();
    db.prepare('UPDATE drives SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Drive status updated' });
});

// Delete drive (admin only)
router.delete('/:id', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const db = getDb();
    db.prepare('DELETE FROM applications WHERE drive_id = ?').run(req.params.id);
    db.prepare('DELETE FROM drives WHERE id = ?').run(req.params.id);
    res.json({ message: 'Drive deleted' });
});

module.exports = router;
