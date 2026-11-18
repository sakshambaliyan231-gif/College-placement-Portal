# 🎓 College Placement Portal

A web-based Placement Management System built to help the **College Placement Cell** manage campus recruitment drives, student registrations, company listings, and track placement status — all in one place.

**Mini Project | B.Tech CSE – 3rd Year**

---

## 📌 Features

### For Placement Cell (Admin)
- **Dashboard** with real-time statistics (students, companies, drives, selections)
- **Company Management** – Add/delete visiting companies
- **Placement Drive Management** – Create drives with eligibility criteria (CGPA, branch, backlogs)
- **Student Database** – View all registered students with search & filter
- **Application Tracking** – View applicants per drive, update status (Shortlisted → Interviewed → Selected/Rejected)
- **Notifications** – Post announcements visible to all students

### For Students
- **Registration** with academic details (Roll No, Branch, CGPA, Skills)
- **Smart Eligibility** – Only see drives you qualify for
- **One-Click Apply** to placement drives
- **Application Tracking** – Track your application status
- **Profile Management** – Update skills, phone, resume link
- **Notifications** – View placement cell announcements

---

## 🛠️ Tech Stack

| Layer      | Technology         |
|------------|--------------------|
| Frontend   | HTML, CSS, JavaScript |
| Backend    | Node.js, Express.js |
| Database   | SQLite (via better-sqlite3) |
| Auth       | bcryptjs, express-session |

---

## 🚀 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
```

The server starts at **http://localhost:3000**

### Default Admin Login
| Field    | Value             |
|----------|-------------------|
| Email    | admin@college.edu |
| Password | admin123          |

---

## 📁 Project Structure

```
college-placement-portal/
├── server.js              # Main server file
├── database.js            # Database setup & initialization
├── package.json
├── routes/
│   ├── auth.js            # Login, Register, Session
│   ├── students.js        # Student profile & eligible drives
│   ├── companies.js       # Company CRUD
│   ├── drives.js          # Placement drive CRUD
│   ├── applications.js    # Apply & track applications
│   └── dashboard.js       # Admin stats & notifications
├── public/
│   ├── index.html         # Landing page
│   ├── student.html       # Student portal
│   ├── admin.html         # Admin panel
│   ├── css/
│   │   └── style.css      # All styles
│   └── js/
│       ├── student.js     # Student frontend logic
│       └── admin.js       # Admin frontend logic
└── placement.db           # SQLite database (auto-created)
```

---

## 📊 Database Schema

- **users** – Stores admin and student login credentials
- **student_profiles** – Academic details (roll no, branch, CGPA, skills)
- **companies** – Registered companies for placement
- **drives** – Placement drives with eligibility criteria
- **applications** – Student applications with status tracking
- **notifications** – Announcements from placement cell

---

## 📸 Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Landing page with features overview |
| Student Portal | `/student` | Student login, register, dashboard |
| Admin Panel | `/admin` | Placement cell management panel |

---

## 🔮 Future Scope

- Email notifications for drive updates
- Resume upload (file storage)
- Placement report generation (PDF)
- Interview scheduling
- Alumni mentorship module

---

## 📝 License

This project is developed as an academic mini project for educational purposes.
