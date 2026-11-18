const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'placement.db');
let db;

function getDb() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

function initialize() {
    const conn = getDb();

    // Users table (admin + students)
    conn.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Student profiles
    conn.exec(`
        CREATE TABLE IF NOT EXISTS student_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            roll_no TEXT UNIQUE NOT NULL,
            branch TEXT NOT NULL,
            year INTEGER NOT NULL,
            cgpa REAL NOT NULL,
            phone TEXT,
            skills TEXT,
            resume_link TEXT,
            backlogs INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Companies
    conn.exec(`
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            website TEXT,
            industry TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Placement drives
    conn.exec(`
        CREATE TABLE IF NOT EXISTS drives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL,
            job_title TEXT NOT NULL,
            job_description TEXT,
            package_lpa REAL NOT NULL,
            min_cgpa REAL DEFAULT 0,
            max_backlogs INTEGER DEFAULT 0,
            eligible_branches TEXT NOT NULL,
            drive_date DATE NOT NULL,
            last_date_apply DATE NOT NULL,
            status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'ongoing', 'completed')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
    `);

    // Applications
    conn.exec(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            drive_id INTEGER NOT NULL,
            status TEXT DEFAULT 'applied' CHECK(status IN ('applied', 'shortlisted', 'interviewed', 'selected', 'rejected')),
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, drive_id),
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (drive_id) REFERENCES drives(id)
        )
    `);

    // Notifications
    conn.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            target TEXT DEFAULT 'all',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create default admin account
    const adminExists = conn.prepare('SELECT id FROM users WHERE email = ?').get('admin@college.edu');
    if (!adminExists) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        conn.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run(
            'Placement Cell Admin', 'admin@college.edu', hashedPassword, 'admin'
        );
        console.log('✅ Default admin account created');
    }

    // Seed some sample companies
    const companyCount = conn.prepare('SELECT COUNT(*) as count FROM companies').get();
    if (companyCount.count === 0) {
        const insertCompany = conn.prepare('INSERT INTO companies (name, website, industry, description) VALUES (?, ?, ?, ?)');
        insertCompany.run('TCS', 'https://www.tcs.com', 'IT Services', 'Tata Consultancy Services - Leading IT services company');
        insertCompany.run('Infosys', 'https://www.infosys.com', 'IT Services', 'Global leader in consulting and technology services');
        insertCompany.run('Wipro', 'https://www.wipro.com', 'IT Services', 'Leading technology services and consulting company');
        insertCompany.run('Google', 'https://www.google.com', 'Technology', 'Multinational technology company');
        insertCompany.run('Microsoft', 'https://www.microsoft.com', 'Technology', 'Leading technology corporation');
        console.log('✅ Sample companies added');
    }

    console.log('✅ Database initialized successfully');
}

module.exports = { getDb, initialize };
