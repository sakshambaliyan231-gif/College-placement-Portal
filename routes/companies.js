const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Get all companies
router.get('/', (req, res) => {
    const db = getDb();
    const companies = db.prepare('SELECT * FROM companies ORDER BY name').all();
    res.json(companies);
});

// Add company (admin only)
router.post('/', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const { name, website, industry, description } = req.body;
    const db = getDb();

    try {
        db.prepare('INSERT INTO companies (name, website, industry, description) VALUES (?, ?, ?, ?)')
            .run(name, website || '', industry || '', description || '');
        res.json({ message: 'Company added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add company' });
    }
});

// Delete company (admin only)
router.delete('/:id', (req, res) => {
    if (req.session.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });

    const db = getDb();
    db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
    res.json({ message: 'Company deleted' });
});

module.exports = router;
