# **UNIFIED FAMILY EDUCATIONAL ERP: COMPLETE SYSTEM DOCUMENTATION**

Generated: July 25, 2026  
Orchestrator: Manus  
Version: 2.0 (Unified Submission Update)

---

## **TABLE OF CONTENTS**

1. Executive Overview  
2. System Architecture  
3. Family Persona Matrix  
4. Google Workspace Integration  
5. AI Engine Room  
6. Frontend Dashboard  
7. Multi-Tenant Authentication  
8. Cloudflare Deployment  
9. Implementation Roadmap  
10. AI Agent Task List  
11. Security & Constraints  
12. 150-Day Curriculum  
13. Prompt Engineering Guide  
14. API Specification  
15. GitHub Repository Structure  
16. Design System

---

## **1\. EXECUTIVE OVERVIEW**

### **1.1 Vision Statement**

The Unified Family Educational ERP is a multi-tenant, AI-powered learning ecosystem that transforms how six family members (Aba, Badu, Kobby, Pappy, Kweku, Shee) learn, grow, and develop skills. The system leverages Google Workspace as its invisible infrastructure backbone while providing a unified, age-appropriate interface for every user.

### **1.2 Core Philosophy: "The Invisible Google"**

* Google is the Engine, Not the Cockpit: Google Classroom handles LMS logic, Google Drive handles storage, and NotebookLM handles knowledge retrieval. However, users interact exclusively with the Unified Dashboard.  
* AI-First Automation: Manus, Gemini Pro, and OpenRouter generate content, grade assignments, and ingest materials without human intervention.  
* Zero Cross-User Data Leakage: Strict OAuth token isolation ensures User A never accesses User B's Drive or Classroom data.

### **1.3 Key Benefits**

* One Dashboard, Six Personalities: Every family member gets a tailored experience without multiple logins or complex navigation.  
* 15GB Free Storage Per User: Leverages existing Google Drive accounts for zero-cost material storage.  
* Local AI Engine Room: Runs on the family laptop for privacy, speed, and cost-efficiency.  
* Offline-Ready PWA: Works on any device, anywhere in the world.

---

## **2\. SYSTEM ARCHITECTURE**

### **2.1 High-Level System Logic Flow**

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                              USER INTERFACE LAYER                          │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    REACT/PWA DASHBOARD                             │   │`  
`│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │   │`  
`│  │  │ Google Login │  │ AI Companion │  │ Storage Progress Bar   │  │   │`  
`│  │  └──────────────┘  └──────────────┘  └────────────────────────┘  │   │`  
`│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐  │   │`  
`│  │  │ Assignments  │  │ Study Hub    │  │ Persona Switcher       │  │   │`  
`│  │  └──────────────┘  └──────────────┘  └────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                    `│`  
                                    `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                         AI ORCHESTRATION LAYER                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    LOCAL AI ENGINE ROOM                            │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │                    MANUS API (ORCHESTRATOR)                  │  │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────────┐  │   │`  
`│  │  │ FastAPI    │ │ Ollama     │ │ Playwright │ │ Baidu OCR API │  │   │`  
`│  │  │ Server     │ │ DeepSeek   │ │ Automation │ │               │  │   │`  
`│  │  └────────────┘ └────────────┘ └────────────┘ └───────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                    `│`  
                                    `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                         GOOGLE WORKSPACE LAYER                            │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │`  
`│  │  │  Google Drive   │  │ Google Classroom│  │  NotebookLM     │    │   │`  
`│  │  │  (15GB/User)    │  │ (LMS & Grading) │  │ (Knowledge Hub) │    │   │`  
`│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`

`└─────────────────────────────────────────────────────────────────────────────┘`

### **2.2 AI Engine Room Orchestration Flow**

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                          DASHBOARD (Frontend)                              │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │  User clicks "Submit Assignment" or "Ask AI Assistant"             │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                     FASTAPI ORCHESTRATOR (Backend)                         │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │  1. Authenticate User via Google OAuth Token                       │   │`  
`│  │  2. Route Request to Appropriate Service                           │   │`  
`│  │  3. Aggregate Response and Return to Dashboard                     │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
          `┌───────────────────────────┼───────────────────────────┐`  
          `│                           │                           │`  
          `▼                           ▼                           ▼`  
`┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐`  
`│  GOOGLE AUTH     │     │  DOCUMENT        │     │  LOCAL LLM       │`  
`│  HANDLER         │     │  PROCESSOR       │     │  CONNECTOR       │`  
`│                  │     │                  │     │                  │`  
`│  - OAuth 2.0     │     │  - Baidu OCR     │     │  - Ollama        │`  
`│  - Token Refresh │     │  - PDF/Word      │     │  - Markdown      │`  
`│  - Scope Mgmt    │     │  - Markdown      │     │  - Qwen          │`  
`└──────────────────┘     └──────────────────┘     └──────────────────┘`  
          `│                           │                           │`  
          `▼                           ▼                           ▼`  
`┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐`  
`│  CLASSROOM API   │     │  DRIVE API       │     │  OPENROUTER API  │`  
`│  - Sync          │     │  - Upload        │     │  - Claude 3.5    │`  
`│  - Create        │     │  - Download      │     │  - GPT-4o        │`  
`│  - Grade         │     │  - List          │     │  - Llama 3       │`  
`│  - Submit        │     │  - Organize      │     │  - Gemini Pro    │`

`└──────────────────┘     └──────────────────┘     └──────────────────┘`

### **2.3 Assignment Management Workflow (Unified Submission)**

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  STEP 1: CONTENT GENERATION (Manus → Gemini Pro)                          │`  
`│  Manus triggers Gemini Pro to generate the week's curriculum based        │`  
`│  on the user's persona and goals                                          │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  STEP 2: ASSIGNMENT CREATION (Engine Room → Classroom API)                │`  
`│  1. Create new CourseWork item                                            │`  
`│  2. Attach study materials (links to Google Drive files or YouTube)       │`  
`│  3. Define GradingRubric based on lesson objectives                       │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  STEP 3: UNIFIED SUBMISSION (User → Dashboard → Classroom API)            │`  
`│  1. User opens Dashboard → "Today's Tasks"                                │`  
`│  2. Click assignment card → Submission Modal slides up                    │`  
`│  3. User uploads file or types response                                  │`  
`│  4. Dashboard sends to Engine Room (POST /v1/submit-assignment)           │`  
`│  5. Engine Room uploads to Drive, patches Classroom submission, turns in  │`  
`│  6. Dashboard updates to "Submitted - Awaiting Grading"                   │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  STEP 4: AUTOMATED GRADING (Classroom API → OpenRouter → Dashboard)       │`  
`│  1. Engine Room polls Classroom API for new StudentSubmissions            │`  
`│  2. Manus downloads submission → sends to appropriate OpenRouter Tutor    │`  
`│  3. AI Tutor grades against rubric → generates feedback                   │`  
`│  4. Engine Room posts Grade and Feedback to Google Classroom via API      │`  
`│  5. Engine Room pushes WebSocket notification to Dashboard                │`  
`│  6. Grade/Feedback appears instantly in user's "Completed Quests" card    │`

`└─────────────────────────────────────────────────────────────────────────────┘`

---

## **3\. FAMILY PERSONA MATRIX**

### **3.1 Persona Overview**

| User | Age | Persona Name | Learning Focus | UI/UX Template | AI Assistant Role | OpenRouter Model |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Aba | 27 | The Architect | BA, AI Consultancy, Enterprise Architecture | Professional (Dark/Gold) | Strategic Advisor | anthropic/claude-3.5-sonnet |
| Badu | 52 | The Master | Cooking recipes, health management, hobbies | Instructional (Emerald) | Patient Companion | meta-llama/llama-3-70b-instruct |
| Kobby | 11 | The Analyst | Coding basics, school curriculum support | Gamified (Cyan) | Tech Mentor | openai/gpt-4o |
| Pappy | 8 | The Explorer | Basic math, science, reading, storytelling | Adventure (Amber) | Storyteller | google/gemini-pro |
| Kweku | 5 | The Discoverer | Phonics, numbers, shapes, creative play | Playful (Purple) | Playmate | google/gemini-pro |
| Shee | 3 | The Seedling | Nursery rhymes, colors, animals, vocabulary | Visual (Lime) | Nurturer | google/gemini-pro |

### **3.2 Vertical-Specific Themes**

| Vertical | Persona | Theme Color | Visual Language |
| :---- | :---- | :---- | :---- |
| Hub | Global Admin | \#d9a84e (Gold) | High-level metrics, system health, cross-user analytics |
| Explorer | Pappy (8y/o) | \#f59e0b (Amber) | Story-based navigation, colorful icons, reward animations |
| Analyst | Kobby (11y/o) | \#22d3ee (Cyan) | Gamified progress bars, "Quest" cards, technical coding blocks |
| Architect | Aba (27y/o) | \#5b8cff (Blue) | Dense data tables, financial ledgers, AI agent control panels |
| Master | Badu (52y/o) | \#10b981 (Emerald) | Step-by-step instructional cards, large text, high-visibility cues |
| Discoverer | Kweku (5y/o) | \#8b5cf6 (Purple) | Large visual targets, voice-first navigation, auto-play media |
| Seedling | Shee (3y/o) | \#84cc16 (Lime) | Icon-only navigation, high-contrast visuals, auto-playing sequences |

### **3.3 Google Classroom Enrollment Matrix**

| User | Role in Classroom | Class/Course Organization |
| :---- | :---- | :---- |
| Aba (27) | Teacher/Student | Owner of all "Family Classroom" courses; Student in professional BA/AI courses |
| Badu (52) | Student | Enrolled in "Master Kitchen" and "Wellness" courses |
| Kobby (11) | Student | Enrolled in "Coding Academy" and "School Support" courses |
| Pappy (8) | Student | Enrolled in "Adventure Science" and "Reading Quest" courses |
| Kweku (5) | Student | Enrolled in "Discovery Play" and "Shapes & Colors" courses |
| Shee (3) | Student | Enrolled in "Seedling Rhymes" and "Animal World" courses |

### **3.4 Multi-Tenant Authentication Methods**

| User | Authentication Method | Details |
| :---- | :---- | :---- |
| Aba (27) | Traditional \+ Biometric | Username/password with optional biometric (fingerprint/face ID) |
| Badu (52) | PIN \+ Avatar | 4-digit PIN combined with unique avatar selection |
| Kobby (11) | Avatar \+ Simple Password | Avatar selection then memorable, short password |
| Pappy (8) | Picture Password \+ Avatar | Avatar selection then sequence of pre-selected images |
| Kweku (5) | Avatar \+ Voice Recognition | Avatar selection then speaks pre-recorded phrase |
| Shee (3) | Avatar Only | Taps unique avatar for automatic login |

---

## **4\. GOOGLE WORKSPACE INTEGRATION**

### **4.1 Google OAuth 2.0 Configuration**

#### Required OAuth Scopes

* profile  
* email  
* drive.file (Isolated app folder only)  
* [classroom.coursework.me](https://classroom.coursework.me/) (User's own submissions only)  
* classroom.rosters (Read user's courses)  
* classroom.coursework.students (Read assignments)  
* [classroom.student-submissions.me](https://classroom.student-submissions.me/) (Manage own submissions)

#### OAuth Flow Diagram

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  1. User clicks "Sign in with Google" on Dashboard                        │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  2. Redirect to Google OAuth 2.0 Authorization Server                     │`  
`│     - client_id: YOUR_CLIENT_ID                                           │`  
`│     - redirect_uri: https://school.yourdomain.com/auth/callback           │`  
`│     - scope: profile email drive.file classroom.coursework.me             │`  
`│     - response_type: code                                                 │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  3. User grants permissions on Google Consent Screen                      │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  4. Google redirects back with authorization code                         │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  5. Dashboard sends code to Engine Room backend                           │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  6. Engine Room exchanges code for access_token and refresh_token         │`  
`│     - Stores encrypted in local SQLite database                           │`  
`│     - Returns user profile to dashboard                                   │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  7. User is logged in and dashboard loads personalized content            │`

`└─────────────────────────────────────────────────────────────────────────────┘`

### **4.2 Google Drive Integration**

#### Drive Folder Structure (Per User)

`text`

`My Drive/`  
`└── Educational ERP/`  
    `├── Study Materials/`  
    `│   ├── Videos/`  
    `│   ├── PDFs/`  
    `│   ├── Articles/`  
    `│   └── Transcripts/`  
    `├── Assignments/`  
    `│   ├── Completed/`  
    `│   └── Drafts/`  
    `├── Submissions/`  
    `│   ├── 2026-07-25_Assignment1/`  
    `│   └── 2026-07-26_Assignment2/`  
    `└── Archives/`

        `└── [Month-Year]/`

#### Drive API Operations

`python`

`class GoogleDriveService:`  
    `def __init__(self, credentials):`  
        `self.service = build('drive', 'v3', credentials=credentials)`  
      
    `def create_educational_folder(self):`  
        `folder_metadata = {`  
            `'name': 'Educational ERP',`  
            `'mimeType': 'application/vnd.google-apps.folder'`  
        `}`  
        `return self.service.files().create(body=folder_metadata).execute()`  
      
    `def upload_file(self, file_path, folder_id):`  
        `file_metadata = {`  
            `'name': os.path.basename(file_path),`  
            `'parents': [folder_id]`  
        `}`  
        `media = MediaFileUpload(file_path, resumable=True)`  
        `return self.service.files().create(`  
            `body=file_metadata,`  
            `media_body=media,`  
            `fields='id, webViewLink'`  
        `).execute()`  
      
    `def get_storage_usage(self):`  
        `about = self.service.about().get(fields='storageQuota').execute()`  
        `return about.get('storageQuota', {})`  
      
    `def list_files_in_folder(self, folder_id):`  
        `query = f"'{folder_id}' in parents and trashed=false"`

        `return self.service.files().list(q=query).execute()`

### **4.3 Google Classroom Integration**

`python`

`class GoogleClassroomService:`  
    `def __init__(self, credentials):`  
        `self.service = build('classroom', 'v1', credentials=credentials)`  
      
    `def list_courses(self):`  
        `return self.service.courses().list().execute()`  
      
    `def create_assignment(self, course_id, title, description, materials=None):`  
        `coursework = {`  
            `'title': title,`  
            `'description': description,`  
            `'workType': 'ASSIGNMENT',`  
            `'state': 'PUBLISHED',`  
            `'materials': materials or [],`  
            `'maxPoints': 100`  
        `}`  
        `return self.service.courses().courseWork().create(`  
            `courseId=course_id,`  
            `body=coursework`  
        `).execute()`  
      
    `def get_submissions(self, course_id, course_work_id):`  
        `return self.service.courses().courseWork().studentSubmissions().list(`  
            `courseId=course_id,`  
            `courseWorkId=course_work_id`  
        `).execute()`  
      
    `def patch_submission(self, course_id, course_work_id, submission_id, file_id):`  
        `submission = {`  
            `'assignmentSubmission': {`  
                `'attachments': [`  
                    `{'driveFile': {'driveFileId': file_id}}`  
                `]`  
            `}`  
        `}`  
        `return self.service.courses().courseWork().studentSubmissions().patch(`  
            `courseId=course_id,`  
            `courseWorkId=course_work_id,`  
            `id=submission_id,`  
            `body=submission,`  
            `updateMask='assignmentSubmission'`  
        `).execute()`  
      
    `def turn_in_submission(self, course_id, course_work_id, submission_id):`  
        `return self.service.courses().courseWork().studentSubmissions().turnIn(`  
            `courseId=course_id,`  
            `courseWorkId=course_work_id,`  
            `id=submission_id`

        `).execute()`

### **4.4 NotebookLM Integration**

#### Automation Flow

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  1. User uploads study material to Google Drive                           │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  2. Engine Room detects new file (webhook or periodic scan)               │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  3. File is sent to Baidu OCR for text extraction (if PDF/Word)           │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  4. Playwright script automates NotebookLM login                          │`  
`│     - Uses browser context with OAuth cookies                             │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  5. File/Text is uploaded to NotebookLM                                   │`  
`│     - Creates a new notebook or adds to existing one                      │`  
`└─────────────────────────────────────────────────────────────────────────────┘`  
                                      `│`  
                                      `▼`  
`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│  6. NotebookLM generates interactive study link                           │`  
`│     - Link is returned to Dashboard for user access                       │`

`└─────────────────────────────────────────────────────────────────────────────┘`

---

## **5\. AI ENGINE Room**

### **5.1 Component Architecture**

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                        AI ENGINE ROOM (Local Laptop)                       │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    FASTAPI ORCHESTRATOR                             │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │  - Route Management                                          │   │`  
`│  │  │  - Authentication Middleware                                 │   │`  
`│  │  │  - Rate Limiting                                             │   │`  
`│  │  │  - WebSocket Server for Real-time Updates                    │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    SERVICES                                         │   │`  
`│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │`  
`│  │  │ Google Auth  │  │ Classroom    │  │ Drive Service             │ │   │`  
`│  │  │ Service      │  │ Sync Service │  │                          │ │   │`  
`│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │   │`  
`│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │`  
`│  │  │ Baidu OCR    │  │ NotebookLM   │  │ Web Scraper              │ │   │`  
`│  │  │ Service      │  │ Automator    │  │                          │ │   │`  
`│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    LOCAL AI MODELS                                  │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │  Ollama Server                                               │  │   │`  
`│  │  │  ┌────────────────────────────────────────────────────────┐  │  │   │`  
`│  │  │  │  Model: DeepSeek                                       │  │  │   │`  
`│  │  │  │  - Summarization                                       │  │  │   │`  
`│  │  │  │  - Persona Adaptation                                  │  │  │   │`  
`│  │  │  │  - Content Generation                                  │  │  │   │`  
`│  │  │  └────────────────────────────────────────────────────────┘  │  │   │`  
`│  │  │  ┌────────────────────────────────────────────────────────┐  │  │   │`  
`│  │  │  │  Model: Qwen                                           │  │  │   │`  
`│  │  │  │  - Backup LLM                                          │  │  │   │`  
`│  │  │  │  - Fallback Processing                                 │  │  │   │`  
`│  │  │  └────────────────────────────────────────────────────────┘  │  │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    EXTERNAL API CLIENTS                              │   │`  
`│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │   │`  
`│  │  │ OpenRouter   │  │ Gemini Pro   │  │ Google APIs             │ │   │`  
`│  │  │ Client       │  │ Client       │  │ (Classroom/Drive)       │ │   │`  
`│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    DATABASE                                          │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │  SQLite (Encrypted)                                          │  │   │`  
`│  │  │  - OAuth Tokens (SQLCipher)                                 │  │   │`  
`│  │  │  - User Profiles                                             │  │   │`  
`│  │  │  - Assignment Cache                                          │  │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`

`└─────────────────────────────────────────────────────────────────────────────┘`

### **5.2 Core Internal APIs**

| Endpoint | Method | Purpose |
| :---- | :---- | :---- |
| /v1/sync-classroom | POST | Pulls assignments/deadlines for the logged-in user |
| /v1/submit-assignment | POST | Accepts file/text, uploads to Drive, attaches to Classroom submission, turns in |
| /v1/ai-chat | POST | Routes queries to OpenRouter with persona injection |
| /v1/process-document | POST | Sends a Drive file to Baidu OCR and returns text |
| /v1/generate-curriculum | POST | Triggers Gemini Pro to build the next study block |
| /v1/drive-usage | GET | Returns user's Drive storage usage (used/total) |
| /v1/notebooklm-upload | POST | Triggers Playwright script to upload materials to NotebookLM |
| /v1/progress-analytics | GET | Returns learning metrics and completion rates |

### **5.3 Baidu OCR Integration**

`python`

`class BaiduOCRService:`  
    `def __init__(self, api_key, secret_key):`  
        `self.api_key = api_key`  
        `self.secret_key = secret_key`  
        `self.access_token = self.get_access_token()`  
      
    `def get_access_token(self):`  
        `url = "https://aip.baidubce.com/oauth/2.0/token"`  
        `params = {`  
            `'grant_type': 'client_credentials',`  
            `'client_id': self.api_key,`  
            `'client_secret': self.secret_key`  
        `}`  
        `response = requests.post(url, params=params)`  
        `return response.json()['access_token']`  
      
    `def process_pdf(self, file_path):`  
        `# Get file from Drive first`  
        `# Convert to image if needed`  
        `# Send to Baidu OCR API`  
        `url = "https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic"`  
        `headers = {'Content-Type': 'application/x-www-form-urlencoded'}`  
        `data = {'access_token': self.access_token}`  
        `# Process file and return text`

        `return extracted_text`

---

## **6\. FRONTEND DASHBOARD**

### **6.1 Component Structure**

`text`

`src/`  
`├── app/`  
`│   ├── sign-in.tsx                 # Google OAuth Login`  
`│   ├── (dashboard)/`  
`│   │   ├── index.tsx              # Main dashboard`  
`│   │   ├── _layout.tsx            # Dashboard layout`  
`│   │   └── [persona]/`  
`│   │       ├── explorer.tsx       # Pappy's view`  
`│   │       ├── analyst.tsx        # Kobby's view`  
`│   │       ├── architect.tsx      # Aba's view`  
`│   │       ├── master.tsx         # Badu's view`  
`│   │       ├── discoverer.tsx     # Kweku's view`  
`│   │       └── seedling.tsx       # Shee's view`  
`│   └── auth/`  
`│       └── callback.tsx           # OAuth callback handler`  
`│`  
`├── components/`  
`│   ├── ui/`  
`│   │   ├── GlassPanel.tsx         # Glassmorphism container`  
`│   │   ├── Button.tsx             # Unified button`  
`│   │   ├── Field.tsx              # Input field`  
`│   │   └── Pill.tsx               # Persona switcher`  
`│   │`  
`│   ├── verticals/`  
`│   │   ├── ExplorerView.tsx       # Lime theme, large icons`  
`│   │   ├── AnalystView.tsx        # Cyan theme, quest cards`  
`│   │   ├── ArchitectView.tsx      # Dark/Gold, data tables`  
`│   │   ├── MasterView.tsx         # Emerald, step-by-step`  
`│   │   ├── DiscovererView.tsx     # Purple, voice-first`  
`│   │   └── SeedlingView.tsx       # Lime, icon-only`  
`│   │`  
`│   ├── classroom/`  
`│   │   ├── ClassroomHub.tsx       # Assignment list`  
`│   │   └── AssignmentCard.tsx     # Individual assignment`  
`│   │`  
`│   ├── submission/`  
`│   │   ├── SubmissionWidget.tsx   # Universal upload`  
`│   │   ├── DragDropZone.tsx       # File drag-drop`  
`│   │   └── VoiceRecorder.tsx      # Audio submission`  
`│   │`  
`│   ├── ai-companion/`  
`│   │   ├── ChatInterface.tsx      # AI chat drawer`  
`│   │   └── MessageBubble.tsx      # Chat message`  
`│   │`  
`│   └── storage/`  
`│       └── StorageProgress.tsx    # Drive usage bar`  
`│`  
`├── hooks/`  
`│   ├── useAuth.ts                 # OAuth state management`  
`│   ├── useClassroom.ts            # Assignment sync`  
`│   ├── useStorage.ts              # Drive usage`  
`│   └── useSubmission.ts           # Submit assignment`  
`│`  
`├── lib/`  
`│   ├── api/`  
`│   │   └── engine-room.ts        # API client`  
`│   └── auth/`  
`│       └── google.ts             # OAuth utilities`  
`│`  
`└── styles/`  
    `├── design-system.ts          # Design tokens`

    `└── themes.ts                  # Persona themes`

---

## **7\. MULTI-TENANT AUTHENTICATION**

### **7.1 Profile Data Structure**

`javascript`

`{`  
  `"userId": "unique_id_aba",`  
  `"name": "Aba",`  
  `"age": 27,`  
  `"persona": "Architect",`  
  `"avatarUrl": "/avatars/aba.png",`  
  `"learningGoals": [`  
    `{ "goalId": "ba_ai_curriculum", "status": "in_progress", "startDate": "2026-07-24" }`  
  `],`  
  `"progress": {`  
    `"totalCourses": 10,`  
    `"completedCourses": 3,`  
    `"completionPercentage": 30,`  
    `"streakDays": 5`  
  `},`  
  `"settings": {`  
    `"theme": "dark_gold",`  
    `"fontSize": "default",`  
    `"notifications": { "email": true, "openclaw": true }`  
  `},`  
  `"aiAssistantConfig": {`  
    `"model": "anthropic/claude-3.5-sonnet",`  
    `"personaPrompt": "You are a strategic advisor..."`  
  `}`

`}`

### **7.2 Session Management**

* Persistent Sessions: User sessions stored securely in cloud database  
* Idle Logout: Age-appropriate idle timeouts (shorter for children, longer for adults)

---

## **8\. CLOUDFLARE DEPLOYMENT**

### **8.1 Deployment Topology**

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                        CLOUDFLARE NETWORK                                  │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    CLOUDFLARE PAGES                                │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │  React/Expo Web Build (PWA)                                 │  │   │`  
`│  │  │  - Custom Domain: school.yourdomain.com                     │  │   │`  
`│  │  │  - Auto-Deploy on GitHub Push                               │  │   │`  
`│  │  │  - Service Workers for Offline                              │  │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    CLOUDFLARE WORKERS                              │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │  - API Routing between Frontend and Cloud DB                │  │   │`  
`│  │  │  - Push Notification Management                              │  │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │                    CLOUDFLARE TUNNEL                               │   │`  
`│  │  ┌──────────────────────────────────────────────────────────────┐  │   │`  
`│  │  │  - Secure Connection to Local Laptop                        │  │   │`  
`│  │  │  - Subdomain: api-local.yourdomain.com                      │  │   │`  
`│  │  │  - No Firewall Ports Required                               │  │   │`  
`│  │  └──────────────────────────────────────────────────────────────┘  │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`

`└─────────────────────────────────────────────────────────────────────────────┘`

### **8.2 CI/CD Pipeline**

`text`

`┌─────────────────────────────────────────────────────────────────────────────┐`  
`│                         CI/CD PIPELINE                                      │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │  GITHUB WORKFLOW (Actions)                                          │   │`  
`│  │  ┌────────────────────────────────────────────────────────────┐    │   │`  
`│  │  │  On: push to main branch                                  │    │   │`  
`│  │  │  Steps:                                                   │    │   │`  
`│  │  │  1. Checkout code                                         │    │   │`  
`│  │  │  2. Install dependencies (npm ci)                         │    │   │`  
`│  │  │  3. Build React app (npm run build)                       │    │   │`  
`│  │  │  4. Run tests (npm test)                                  │    │   │`  
`│  │  │  5. Deploy to Cloudflare Pages                            │    │   │`  
`│  │  └────────────────────────────────────────────────────────────┘    │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`  
`│                                                                             │`  
`│  ┌─────────────────────────────────────────────────────────────────────┐   │`  
`│  │  DEPLOYMENT STAGES                                                  │   │`  
`│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐          │   │`  
`│  │  │   DEV      │  │  STAGING   │  │  PRODUCTION        │          │   │`  
`│  │  │  (develop) │─►│  (staging) │─►│  (main)            │          │   │`  
`│  │  └────────────┘  └────────────┘  └────────────────────┘          │   │`  
`│  └─────────────────────────────────────────────────────────────────────┘   │`

`└─────────────────────────────────────────────────────────────────────────────┘`

### **8.3 PWA Configuration**

#### manifest.json

`json`

`{`  
  `"name": "Family Educational ERP",`  
  `"short_name": "EduERP",`  
  `"description": "AI-powered learning for the whole family",`  
  `"start_url": "/",`  
  `"display": "standalone",`  
  `"background_color": "#000000",`  
  `"theme_color": "#d9a84e",`  
  `"icons": [`  
    `{ "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },`  
    `{ "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }`  
  `]`

`}`

#### Service Worker

`javascript`

`const CACHE_NAME = 'erp-v1';`  
`const urlsToCache = ['/', '/index.html', '/static/js/main.js'];`

`self.addEventListener('install', event => {`  
  `event.waitUntil(`  
    `caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))`  
  `);`  
`});`

`self.addEventListener('fetch', event => {`  
  `event.respondWith(`  
    `caches.match(event.request).then(response => response || fetch(event.request))`  
  `);`

`});`

---

## **9\. IMPLEMENTATION ROADMAP**

### **Phase 1: Google Auth & Storage (Days 1-3)**

| Deliverable | Description | Target Agent |
| :---- | :---- | :---- |
| D1.1: Google OAuth 2.0 | Implement Google Sign-In with scopes for Drive and Classroom | Google Studio |
| D1.2: Drive Manager | Build module to create and manage "Study Material" folders in each user's 15GB Drive | DeepSeek/Qwen |
| D1.3: Multi-Tenant Setup | Ensure each family member has isolated Google storage context | DeepSeek/Qwen |
| D1.4: FastAPI Base | Initialize FastAPI with Pydantic schemas for User, Task, Response | Qwen/DeepSeek |
| D1.5: Google Auth Handler | Implement OAuth 2.0 flow to manage individual user tokens | DeepSeek/Grok |
| D1.6: Secure Tunnel | Configure Cloudflare Tunnel to expose local API to PWA | Qwen/DeepSeek |

### **Phase 2: LMS & Knowledge Hub (Days 4-7)**

| Deliverable | Description | Target Agent |
| :---- | :---- | :---- |
| D2.1: Classroom API Sync | Automate assignment creation and submission tracking | Qwen/DeepSeek |
| D2.2: NotebookLM Automator | Implement browser automation to upload Drive files to NotebookLM | Qwen/Grok |
| D2.3: Baidu OCR Pipeline | Convert PDFs/Word from Drive into text for NotebookLM ingestion | DeepSeek/Grok |
| D2.4: Drive File Manager | Organize files in user-specific "Educational ERP" folders | DeepSeek/Qwen |
| D2.5: Web Content Engine | Implement scrapers for YouTube transcripts and Coursera course audits | DeepSeek/Grok |
| D2.6: Local LLM Connector | Build wrapper for Ollama to handle local summarization | Qwen/DeepSeek |

### **Phase 3: Persona-Driven Dashboard (Days 8-11)**

| Deliverable | Description | Target Agent |
| :---- | :---- | :---- |
| D3.1: Unified Dashboard | Build dashboard displaying Classroom assignments and NotebookLM links | Google Studio |
| D3.2: AI Companion Drawer | Integrate OpenRouter assistant with context awareness | Google Studio |
| D3.3: Vertical UI Themes | Apply age-appropriate templates (Explorer, Analyst, Architect, Master) | Google Studio |
| D3.4: Classroom Sync Bot | Automate assignment creation, grading notifications, material posting | Qwen/DeepSeek |
| D3.5: NotebookLM Automator | Develop Playwright scripts for automated ingestion | Grok/Qwen |

### **Phase 4: Full Deployment & Monitoring (Days 12-14)**

| Deliverable | Description | Target Agent |
| :---- | :---- | :---- |
| D4.1: Cloudflare Tunnel | Securely expose local AI Engine Room to PWA | DeepSeek/Qwen |
| D4.2: PWA Service Workers | Enable offline access to cached Google Drive materials | Google Studio |
| D4.3: Progress Analytics | Build service to calculate learning metrics | Qwen/DeepSeek |
| D4.4: Adaptive Goal Engine | Use local LLMs to suggest new study paths | DeepSeek/Grok |
| D4.5: Mobile Optimization | Apply responsive design, configure manifest.json and service workers | Google Studio |
| D4.6: Multi-Tenant Vertical Launch | Deploy all six vertical themes, verify data isolation and RBAC | All Agents |

---

## **10\. AI AGENT TASK LIST**

### **Agent Assignment Legend**

* GS: Google Studio (Frontend/UI)  
* Qwen: Qwen/DeepSeek (Backend/Python Logic)  
* Grok: Grok (Automation/Playwright)  
* Manus: Manus (Vetting & Coordination)

### **Phase 1: Google Auth & Storage (Days 1-3)**

#### GS (Google Studio \- Frontend)

* □ D1.1: Google OAuth 2.0  
  * □ Implement src/app/sign-in.tsx using expo-auth-session  
  * □ Request scopes: profile, email, drive.file, [classroom.coursework.me](https://classroom.coursework.me/)  
  * □ Handle OAuth callback and store tokens in secure storage  
* □ D1.2: Drive Monitor UI  
  * □ Build src/components/storage-progress.tsx  
  * □ Fetch and display used/free space from the Engine Room API  
* □ D1.3: Classroom Hub Card  
  * □ Create src/components/classroom-card.tsx  
  * □ Display active assignments, due dates, and submission status

#### Qwen/DeepSeek (Backend)

* □ D1.4: FastAPI Base  
  * □ Initialize src/engine-room/main.py with CORS and routing  
  * □ Define Pydantic schemas for User, Assignment, Submission  
* □ D1.5: Google Auth Handler  
  * □ Build src/engine-room/auth/google\_auth.py  
  * □ Implement token refresh logic for Drive/Classroom  
* □ D1.6: Drive Folder Creator  
  * □ Write logic to create "Educational ERP" folder in user's Drive  
  * □ Return the folderId for future operations

#### Grok (Infrastructure)

* □ D1.7: Cloudflare Tunnel Setup  
  * □ Draft cloudflared configuration  
  * □ Test secure exposure of localhost:8000 to a public subdomain  
* □ D1.8: GitHub Actions  
  * □ Create .github/workflows/deploy.yml for Cloudflare Pages

### **Phase 2: LMS & Knowledge Hub (Days 4-7)**

#### Qwen/DeepSeek (Backend)

* □ D2.1: Classroom API Sync  
  * □ Build src/engine-room/classroom\_sync.py  
  * □ Implement GET /v1/sync-classroom to pull courseWork and submissions  
  * □ Filter assignments by the current user's persona  
* □ D2.2: Unified Submission API (Critical)  
  * □ Build POST /v1/submit-assignment  
  * □ Logic: Accept file → Upload to Drive → Patch Classroom submission → Turn in  
  * □ Return JSON { "status": "submitted", "submissionId": "123" }  
* □ D2.3: Baidu OCR Pipeline  
  * □ Build src/engine-room/ocr\_service.py  
  * □ Accept a Drive fileId, download, send to Baidu, return text

#### Grok (Automation)

* □ D2.4: NotebookLM Automator  
  * □ Write Playwright script in src/engine-room/notebooklm\_upload.py  
  * □ Log in to NotebookLM via browser context (OAuth simulation)  
  * □ Upload files from a specified Drive folder path  
* □ D2.5: Web Content Scraper  
  * □ Implement YouTube transcript scraper (using youtube-transcript-api)  
  * □ Implement Coursera course outline scraper

#### GS (Frontend)

* □ D2.6: Dashboard Layout  
  * □ Build src/app/(dashboard)/index.tsx  
  * □ Add "Today's Tasks" section and "Storage Health" widget

### **Phase 3: Persona-Driven Dashboard (Days 8-11)**

#### GS (Frontend)

* □ D3.1: Universal Submission Widget  
  * □ Build src/components/submission-widget.tsx  
  * □ Include drag-and-drop for files, text input, and a "Big Green Button" for toddlers  
  * □ Connect to useSubmitAssignment hook  
* □ D3.2: AI Companion Drawer  
  * □ Build src/components/ai-companion/index.tsx  
  * □ Integrate with POST /v1/ai-chat  
  * □ Pass persona prompt based on current user  
* □ D3.3: Vertical UI Themes  
  * □ Implement ExplorerView.tsx (Lime, large icons)  
  * □ Implement AnalystView.tsx (Cyan, quest cards)  
  * □ Implement ArchitectView.tsx (Dark/Gold, data tables)  
  * □ Implement MasterView.tsx (Emerald, step-by-step guides)

#### Qwen/DeepSeek (Backend)

* □ D3.4: OpenRouter Persona Injection  
  * □ Build src/engine-room/ai\_chat.py  
  * □ Fetch user profile from DB  
  * □ Inject persona-specific system prompt into the OpenRouter call  
* □ D3.5: Adaptive Goal Engine  
  * □ Build logic to analyze completion rates  
  * □ Suggest next study paths using local DeepSeek

### **Phase 4: Deployment & PWA (Days 12-14)**

#### GS (Frontend)

* □ D4.1: PWA Manifest & Service Workers  
  * □ Configure manifest.json with family icons  
  * □ Register service worker in src/app/\_layout.tsx  
  * □ Cache Google Drive materials for offline access  
* □ D4.2: Mobile Responsiveness  
  * □ Apply responsive grid (6-col desktop to 1-col mobile)  
  * □ Ensure touch targets are \>= 44px

#### Qwen/DeepSeek (Backend)

* □ D4.3: Progress Analytics  
  * □ Build src/engine-room/analytics.py  
  * □ Calculate completion percentage and streak metrics  
* □ D4.4: Final Error Handling  
  * □ Implement rate limiting for OpenRouter/Baidu  
  * □ Catch "Quota Exceeded" errors and notify dashboard

#### Grok (DevOps)

* □ D4.5: Production Tunnel  
  * □ Finalize Cloudflare Tunnel for the local Engine Room  
  * □ Set up environment variables for API keys

---

## **11\. SECURITY & CONSTRAINTS**

### **11.1 Technical Constraints**

`text`

`┌─────────────────────────────────────────────────────────────────────┐`  
`│                    TECHNICAL CONSTRAINTS                            │`  
`│                                                                     │`  
`│  1. STORAGE LIMITS                                                 │`  
`│     - Google Drive: 15GB per user                                 │`  
`│     - Local storage: 100GB max                                   │`  
`│     - Cloud database: 1GB free tier (MongoDB/Supabase)          │`  
`│                                                                     │`  
`│  2. API LIMITS                                                     │`  
`│     - OpenRouter: 100 requests/minute                            │`  
`│     - Gemini Pro: 60 requests/minute                             │`  
`│     - Google APIs: 10,000 requests/day                          │`  
`│     - Baidu OCR: 100 pages/minute                               │`  
`│                                                                     │`  
`│  3. PERFORMANCE REQUIREMENTS                                       │`  
`│     - Page load time: < 2 seconds                                │`  
`│     - API response time: < 500ms                                │`  
`│     - WebSocket latency: < 100ms                                │`  
`│     - Offline support: Full PWA capabilities                    │`  
`│                                                                     │`  
`│  4. SCALING CONSTRAINTS                                            │`  
`│     - Max concurrent users: 6 (family members)                   │`  
`│     - Max concurrent API calls: 10                              │`  
`│     - Local LLM response time: < 5 seconds                      │`  
`│                                                                     │`  
`│  5. DEPENDENCY CONSTRAINTS                                         │`  
`│     - Node.js 18+ required                                       │`  
`│     - Python 3.9+ required                                       │`  
`│     - Chrome/Chromium required (Playwright)                     │`  
`│     - Internet connection required for cloud APIs               │`

`└─────────────────────────────────────────────────────────────────────┘`

### **11.2 Security Constraints**

`text`

`┌─────────────────────────────────────────────────────────────────────┐`  
`│                    SECURITY CONSTRAINTS                             │`  
`│                                                                     │`  
`│  1. AUTHENTICATION                                                 │`  
`│     - Must use Google OAuth 2.0 only                              │`  
`│     - No password storage                                         │`  
`│     - MFA required for admin access                               │`  
`│     - Session timeout: 1 hour (inactivity)                        │`  
`│                                                                     │`  
`│  2. ENCRYPTION                                                     │`  
`│     - All OAuth tokens encrypted at rest                          │`  
`│     - TLS 1.3 for all network traffic                             │`  
`│     - AES-256 for local token storage                             │`  
`│                                                                     │`  
`│  3. DATA PROTECTION                                                │`  
`│     - No cross-user data access                                   │`  
`│     - PII filtered before cloud processing                       │`  
`│     - Data retention: max 1 year (auto-archive)                  │`  
`│                                                                     │`  
`│  4. COMPLIANCE                                                     │`  
`│     - GDPR compliant (data deletion on request)                   │`  
`│     - COPPA compliant (parental consent for minors)              │`  
`│     - FERPA compliant (educational data privacy)                 │`

`└─────────────────────────────────────────────────────────────────────┘`

---

## **12\. 150-DAY CURRICULUM**

### **12.1 Daily Schedule (14 Hours, Monday-Saturday)**

| Time Block | Duration | Operational Focus | Pedagogical Purpose |
| :---- | :---- | :---- | :---- |
| 02:00 AM \- 08:00 AM | 6 Hours | Core Theory, Domain Fluency, & Accounting | Deep reading, university lectures, financial accounting, BABOK knowledge areas |
| 08:00 AM \- 09:00 AM | 1 Hour | Biological Reset & Nutrition | Physical movement, hydration, cognitive detachment |
| 09:00 AM \- 03:00 PM | 6 Hours | Technical Labs, Programming, & BI | Applied coding (Java/Python), BI dashboard development, SQL querying, AI API integrations |
| 03:00 PM \- 04:00 PM | 1 Hour | Secondary Biological Reset | Nutrition and mental transition |
| 04:00 PM \- 06:00 PM | 2 Hours | Enterprise Project Synthesis & Mock Exams | Applying knowledge to GitHub projects, Visio diagramming, timed quizzes |
| 06:00 PM \- 02:00 AM | 8 Hours | Neurological Consolidation (Sleep) | Mandatory rest period for memory consolidation |

### **12.2 Month-by-Month Breakdown**

Month 1: Business Analysis Foundations & Financial Literacy

* BABOK Guide mastery (6 core knowledge areas)  
* Microsoft Visio diagramming  
* Financial Accounting (Wharton School)  
* Project: Current-State Diagnostic & Financial Audit

Month 2: Business Intelligence, Data Engineering & Dashboarding

* Microsoft Power BI (PL-300 certification preparation)  
* Tableau data visualization  
* Google BI ecosystem (BigQuery, Looker)  
* Project: Omni-Channel BI Dashboard Suite

Month 3: Programming Paradigms & Enterprise Systems Architecture

* Python for backend APIs and data processing  
* Java and object-oriented enterprise architecture  
* Software architecture and system design  
* Project: Enterprise API Architecture

Month 4: Artificial Intelligence, Agentic Systems & MCP

* AI fluency, prompt engineering, RAG architecture  
* Model Context Protocol (MCP) and agentic orchestration  
* Building custom MCP servers  
* Project: Autonomous MCP Agent

Month 5: Capstone Synthesis, Agency Training & Certification

* Training the AI Agency and diagnostic consulting  
* Final mock exams and certification readiness  
* Project: End-to-End Enterprise Transformation Audit

### **12.3 Key Certifications Prepared For**

* IIBA ECBA/CBAP (Business Analysis)  
* Microsoft PL-300 (Power BI Data Analyst)  
* Anthropic CCAR-F (Claude Certified Architect \- Foundations)  
* Tableau Desktop Specialist (optional)

---

## **13\. PROMPT ENGINEERING GUIDE**

### **13.1 General Structure**

`text`

`You are a [ASSISTANT_ROLE] for a [AGE]-year-old named [USER_NAME].`  
`Your primary goal is to [PRIMARY_GOAL].`  
`Maintain a [TONE] tone and use [LANGUAGE_COMPLEXITY] language.`  
`Current Learning Context: [LEARNING_CONTEXT].`  
`User's Recent Progress: [PROGRESS_UPDATE].`

`User Query: [USER_QUERY]`

### **13.2 Persona-Specific Prompts**

#### Aba (Architect \- Age 27\)

`text`

`You are a Strategic Advisor for a 27-year-old business analyst named Aba.`  
`Your primary goal is to provide analytical insights, vet strategic plans,`  
`and troubleshoot technical challenges related to Enterprise Architecture.`  
`Maintain a professional, analytical, and concise tone, using advanced, technical language.`  
`Current Learning Context: Designing a multi-tenant Educational ERP system.`  
`User's Recent Progress: Completed research on local AI integration and cloud database options.`

`User Query: [USER_QUERY]`

#### Badu (Master \- Age 52\)

`text`

`You are a Patient Companion for a 52-year-old named Badu, who is learning new cooking recipes.`  
`Your primary goal is to guide her through steps, answer "how-to" questions,`  
`and offer encouraging words.`  
`Maintain a warm, encouraging, and clear tone, using simple, practical language.`  
`Current Learning Context: Mastering homemade lasagna.`  
`User's Recent Progress: Successfully made the béchamel sauce.`

`User Query: [USER_QUERY]`

#### Kobby (Analyst \- Age 11\)

`text`

`You are a Tech Mentor for an 11-year-old named Kobby, who is learning Python and data visualization.`  
`Your primary goal is to explain coding concepts, provide engaging challenges,`  
`and track his progress in quests.`  
`Maintain an enthusiastic, challenging, and supportive tone, using intermediate, technical language.`  
`Current Learning Context: Understanding Python data types.`  
`User's Recent Progress: Completed the basic variables lesson.`

`User Query: [USER_QUERY]`

#### Pappy (Explorer \- Age 8\)

`text`

`You are a Storyteller for an 8-year-old named Pappy, who is exploring basic science concepts.`  
`Your primary goal is to narrate lessons, guide him through interactive games,`  
`and make learning an adventure.`  
`Maintain a playful, imaginative, and gentle tone, using simple, narrative language.`  
`Current Learning Context: Learning about the solar system.`  
`User's Recent Progress: Identified all the planets.`

`User Query: [USER_QUERY]`

#### Kweku (Discoverer \- Age 5\)

`text`

`You are a Playmate for a 5-year-old named Kweku, who is discovering shapes and colors.`  
`Your primary goal is to encourage exploration, celebrate small wins,`  
`and make learning fun with sounds and visuals.`  
`Maintain a cheerful, encouraging, and simple tone, using very simple, direct language.`  
`Current Learning Context: Identifying red objects.`  
`User's Recent Progress: Pointed to a red apple.`

`User Query: [USER_QUERY]`

#### Shee (Seedling \- Age 3\)

`text`

`You are a Nurturer for a 3-year-old named Shee, who is learning nursery rhymes and animal sounds.`  
`Your primary goal is to play songs, name objects, and provide a comforting presence.`  
`Maintain a soothing, gentle, and very simple tone, using extremely simple, repetitive language.`  
`Current Learning Context: Learning animal sounds.`  
`User's Recent Progress: Made a 'moo' sound for a cow.`

`User Query: [USER_QUERY]`

### **13.3 Prompt Injection Logic**

1. User sends query to /v1/ai-chat  
2. Engine Room fetches user profile from database  
3. Extracts persona and aiAssistantConfig  
4. Loads the appropriate prompt template  
5. Replaces placeholders:  
   * \[USER\_NAME\] → user's name  
   * \[AGE\] → user's age  
   * \[USER\_QUERY\] → user's actual question  
   * \[LEARNING\_CONTEXT\] → current goal from user's learningGoals  
   * \[PROGRESS\_UPDATE\] → latest progress metrics  
6. Injects the system prompt into OpenRouter request  
7. Returns response to Dashboard

---

## **14\. API SPECIFICATION**

### **14.1 Base URL**

* Local: [http://localhost:8000](http://localhost:8000/)  
* Production: [https://api-local.yourdomain.com](https://api-local.yourdomain.com/)

### **14.2 Authentication**

All endpoints require a valid Google OAuth access token:

`text`

`Authorization: Bearer <access_token>`

### **14.3 Endpoints**

#### 1\. Classroom Sync

POST /v1/sync-classroom

Request:

`json`

`{`  
  `"courseId": "course_456"`

`}`

Response:

`json`

`{`  
  `"assignments": [`  
    `{`  
      `"id": "cw_789",`  
      `"title": "Enterprise Architecture Analysis",`  
      `"description": "Analyze the microservices architecture...",`  
      `"dueDate": "2026-07-30T00:00:00Z",`  
      `"state": "PUBLISHED",`  
      `"submissionState": "CREATED",`  
      `"maxPoints": 100`  
    `}`  
  `]`

`}`

#### 2\. Submit Assignment

POST /v1/submit-assignment

Request (multipart/form-data):

`text`

`courseId: course_456`  
`courseWorkId: cw_789`  
`file: <File>`

`textResponse: string`

Response:

`json`

`{`  
  `"status": "submitted",`  
  `"submissionId": "sub_456",`  
  `"driveFileId": "file_sub_123"`

`}`

#### 3\. AI Chat

POST /v1/ai-chat

Request:

`json`

`{`  
  `"message": "What are the security vulnerabilities in microservices?",`  
  `"persona": "Architect",`  
  `"conversationId": "conv_123"`

`}`

Response:

`json`

`{`  
  `"response": "Based on enterprise architecture best practices...",`  
  `"conversationId": "conv_123"`

`}`

#### 4\. Process Document

POST /v1/process-document

Request:

`json`

`{`  
  `"driveFileId": "file_abc",`  
  `"fileType": "pdf"`

`}`

Response:

`json`

`{`  
  `"text": "Extracted text from the document...",`  
  `"markdown": "Extracted text in Markdown format..."`

`}`

#### 5\. Generate Curriculum

POST /v1/generate-curriculum

Request:

`json`

`{`  
  `"persona": "Architect",`  
  `"topic": "Microservices Architecture",`  
  `"goalId": "ba_ai_curriculum"`

`}`

Response:

`json`

`{`  
  `"studyMaterials": [`  
    `{`  
      `"type": "video",`  
      `"title": "Microservices Fundamentals",`  
      `"url": "https://youtube.com/..."`  
    `}`  
  `],`  
  `"assignment": {`  
    `"title": "Microservices Case Study",`  
    `"description": "Analyze a real-world microservices implementation...",`  
    `"rubric": "Criteria: Architecture Design (30%), Security (25%)..."`  
  `}`

`}`

#### 6\. Drive Usage

GET /v1/drive-usage

Response:

`json`

`{`  
  `"used": 2500000000,`  
  `"total": 15000000000,`  
  `"percentage": 16.67,`  
  `"free": 12500000000`

`}`

#### 7\. Auth Exchange Code

POST /v1/auth/exchange-code

Request:

`json`

`{`  
  `"code": "oauth_code_from_google"`

`}`

Response:

`json`

`{`  
  `"access_token": "user_access_token",`  
  `"refresh_token": "user_refresh_token",`  
  `"expires_in": 3600,`  
  `"user": {`  
    `"id": "google_user_id",`  
    `"name": "Aba",`  
    `"email": "aba@example.com",`  
    `"persona": "Architect"`  
  `}`

`}`

#### 8\. Auth Refresh

POST /v1/auth/refresh

Request:

`json`

`{`  
  `"refresh_token": "user_refresh_token"`

`}`

Response:

`json`

`{`  
  `"access_token": "new_access_token",`  
  `"expires_in": 3600`

`}`

### **14.4 Error Codes**

| Code | Description |
| :---- | :---- |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |

Error Response:

`json`

`{`  
  `"error": {`  
    `"code": 401,`  
    `"message": "Invalid access token",`  
    `"details": "Token expired. Use /auth/refresh to get a new token."`  
  `}`

`}`

---

## **15\. GITHUB REPOSITORY STRUCTURE**

`text`

`/`  
`├── .github/`  
`│   └── workflows/`  
`│       └── deploy.yml          # Cloudflare Pages deployment`  
`├── docs/`  
`│   ├── ARCHITECTURE.md         # System design`  
`│   ├── TODO.md                 # AI task list`  
`│   ├── API_SPEC.md             # Backend endpoints`  
`│   ├── PROMPT_ENGINEERING.md   # AI prompts`  
`│   ├── DESIGN_SYSTEM.md        # UI components`  
`│   ├── DEPLOYMENT.md           # Cloudflare setup`  
`│   └── USER_GUIDE.md           # How to use`  
`├── src/`  
`│   ├── apps/`  
`│   │   ├── dashboard/          # React/Next.js Web Dashboard`  
`│   │   └── mobile/             # Expo/React Native Mobile App`  
`│   ├── engine-room/            # Local AI orchestration (Python)`  
`│   └── shared/                 # Shared DB schemas and types`  
`├── .env.example                # Environment variables template`

`└── README.md                   # Project overview`

---

## **16\. DESIGN SYSTEM**

### **16.1 Philosophy**

One Spine, Many Skins. All verticals share the same underlying data structure and API, but the interface morphs to suit each user's cognitive and functional needs.

### **16.2 Typography**

| Type | Font | Usage |
| :---- | :---- | :---- |
| Display | Space Grotesk | Headings, Hero text |
| Body | Inter | Body text, Paragraphs |
| Accent | JetBrains Mono | AI logs, Technical data, Code |

### **16.3 Base Palette**

| Element | Color | Value |
| :---- | :---- | :---- |
| Background | Pure Black | \#000000 |
| Surface | Glassmorphism | rgba(255,255,255,0.03) |
| Border | Subtle | rgba(255,255,255,0.1) |
| Text Primary | White | \#FFFFFF |
| Text Secondary | Muted | rgba(255,255,255,0.7) |

### **16.4 Components**

#### Pill (Persona Switcher)

`text`

`[Ab] [Ba] [Ko] [Pa] [Kw] [Sh]`

 `●    ○    ○    ○    ○    ○`

#### GlassPanel

Glassmorphism container with:

* Background: rgba(255,255,255,0.03)  
* Border: rgba(255,255,255,0.1)  
* Blur: 20px

#### Metric Card

`text`

`📊 Points: 450`  
`🔥 Streak: 5 days`

`📈 Completion: 30%`

#### Assignment Card

`text`

`📝 Enterprise Architecture Analysis`  
`Due: July 30, 2026`  
`Status: Submitted - Awaiting Grade`

`[View Submission] [AI Help]`

#### Submission Widget

* Drag and drop file upload  
* Text input area  
* Voice record button (toddlers/seniors)  
* "I'm Done\!" button (seedlings)

#### AI Companion Drawer

* Persistent bottom drawer  
* Chat interface with AI  
* Persona-aware responses

#### Storage Progress

`text`

`💾 Google Drive Storage`  
`████████████░░░░░░░░░░ 2.5GB / 15GB`  
`Used: 16.7%`

`Free: 12.5GB`

### **16.5 Responsive Breakpoints**

| Screen | Breakpoint | Columns |
| :---- | :---- | :---- |
| Mobile | \< 640px | 1 |
| Tablet | 640-1024px | 2 |
| Desktop | 1024-1440px | 4 |
| Wide | \> 1440px | 6 |

### **16.6 Touch Targets**

* Minimum touch target: 44x44px  
* Minimum font size for mobile: 16px  
* Spacing between interactive elements: 8px minimum

---

END OF COMPLETE DOCUMENTATION
