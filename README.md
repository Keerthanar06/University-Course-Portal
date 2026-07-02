# Cloud-Based University Course Portal

A modern, responsive University Course Portal website representing hosting on AWS, utilizing a professional academic design theme (navy and champagne gold). The application implements role-based views (Admin, Faculty, Student) and integrates a simulated AWS Control Console to interactively explore and visualize Cloud Architecture elements.

---

## 🏛️ Project Architecture & AWS Integration

The portal represents standard AWS services locally to make deployment demonstration straightforward:
1. **EC2 Instance Hosting**: The web server runs a Node.js/Express backend that handles application API endpoints.
2. **S3 Object Storage (Online Notes Sharing)**: File uploads (PDFs, videos, zip files) are saved locally under `backend/uploads/` representing the storage bucket `s3://university-course-portal-bucket-prod/`. Metadata is tracked using simulated S3 Keys and bucket policies.
3. **RDS Database (Relational Engine)**: System data is managed in structured tables using a local SQLite3 engine (`backend/portal.db`), mapping users, enrollments, course metadata, and assignment details.
4. **VPC Network Topology (Security)**: The Administrator dashboard includes an **Interactive SVG Network Map** illustrating subnet boundaries (`10.0.0.0/16`), Route Tables, Internet Gateways, and S3 Gateway VPC Endpoints.
5. **IAM Access Control (Role authentication)**: Authentication uses security credentials and cryptographically signed JWT tokens, mapping permissions inline (like `s3:GetObject` and `rds:Select`) to Admin, Faculty, and Student roles.

---

## 🚀 Getting Started

The project is pre-built. You can launch it using either of these methods:

### Method 1: Double-Click Launcher (Windows)
Double-click the `start_portal.bat` file in the root directory. This will start the single-port server and automatically serve both the frontend UI and APIs on:
👉 **[http://localhost:5000/](http://localhost:5000/)**

### Method 2: Command Line Startup
1. Open a terminal in the root directory.
2. Run the start command:
   ```bash
   node backend/server.js
   ```
3. Open `http://localhost:5000/` in your browser.

### Method 3: Concurrent Development Servers
For developers looking to make adjustments to code and test hot-reloading:
1. Run the developer installation:
   ```bash
   npm run install-all
   ```
2. Start the dev environment concurrently:
   ```bash
   npm run dev
   ```
3. Open the Vite frontend at `http://localhost:5173/` (or `http://localhost:5174/` if 5173 is in use) and the backend API will run on `http://localhost:5000/`.

---

## 🔑 Pre-Seeded Demo Credentials

Log in using any of the following accounts:

| User Profile | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@apex.edu` | `admin123` |
| **Faculty Member** | `alan.turing@apex.edu` | `faculty123` |
| **Student** | `student.alice@apex.edu` | `student123` |

---

## 📂 Project Structure

```
university_course_portal/
├── backend/
│   ├── db.js                 # Database schema initialization and seed content
│   ├── portal.db             # Seeding SQLite database file (RDS Simulator)
│   ├── server.js             # Main server routes and static directories configurations
│   ├── uploads/              # S3 simulated bucket directory containing uploaded assets
│   └── routes/
│       ├── auth.js           # Handles logins, profiles, and admin IAM allocations
│       ├── courses.js        # Catalog, enrollment drops, and announcements
│       ├── materials.js      # S3 file downloads and uploads pipeline
│       ├── assignments.js    # Task descriptions and submissions uploading
│       └── aws.js            # System CPU stats and VPC firewall controls
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AWSVisualizer.jsx # SVG mapping canvas and firewall toggles
│   │   │   ├── Navbar.jsx        # Navigation header
│   │   │   └── Footer.jsx        # Footer with metadata details
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Hero site with login entry
│   │   │   ├── Dashboard.jsx     # Course catalogs and announcement lists
│   │   │   ├── CourseDetails.jsx # Assignments submissions and folder downloads
│   │   │   ├── AdminPanel.jsx    # User rosters lists and CloudTrail terminals
│   │   │   ├── DocPortal.jsx     # VPC layout diagrams and deployment guides
│   │   │   └── Profile.jsx       # Active session keys and security policies
│   │   ├── App.jsx           # Views router
│   │   └── index.css         # Academic design token styling rules
│   └── package.json          # Vite packages declarations
│
├── package.json              # Concurrently developer scripts
├── start_portal.bat          # Click-to-run startup script
└── README.md                 # Project handbook
```

---

## 👨‍💻 Verification Details

* **Production Bundle**: Frontend code compiled successfully with Vite. Dist folder is fully ready.
* **Server Health**: SQLite successfully initializes tables and seeds the demo parameters on launch.
* **AWS Integration Controls**:
  - Toggling SG rules in the Admin Panel edits firewall status.
  - S3 Upload paths are verified; file hashes and keys write successfully to the database.
  - Logging actions (S3 Get/Put, RDS Write, IAM login) write details into the CloudTrail logging terminal.
