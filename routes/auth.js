const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');

// Register student
router.post('/register', (req, res) => {
    const { name, email, password, roll_no, branch, year, cgpa, phone, skills, backlogs } = req.body;
    const db = getDb();

    try {
        // Check if email already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const insertUser = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
        const result = insertUser.run(name, email, hashedPassword, 'student');

        const insertProfile = db.prepare(
            'INSERT INTO student_profiles (user_id, roll_no, branch, year, cgpa, phone, skills, backlogs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        insertProfile.run(result.lastInsertRowid, roll_no, branch, year, cgpa, phone || '', skills || '', backlogs || 0);

        res.json({ message: 'Registration successful! Please login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed. Roll number might already exist.' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    req.session.role = user.role;
    req.session.name = user.name;

    res.json({ message: 'Login successful', role: user.role, name: user.name });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Check session
router.get('/me', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }
    res.json({ id: req.session.userId, role: req.session.role, name: req.session.name });
});

module.exports = router;
