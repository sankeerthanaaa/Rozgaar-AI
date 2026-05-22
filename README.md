# Rozgaar-AI — Intelligent Resume Analyzer & Career Assistant

> An AI-powered full-stack web application that analyzes resumes, matches job descriptions, generates interview questions, and provides personalized career guidance using multi-provider AI (Groq, Gemini, OpenAI).

---

## Table of Contents

- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Team & Contributors](#-team--contributors)

---

## Project Overview

**Rozgaar-AI** is a smart career assistant platform designed to help students and job seekers improve their chances of getting hired. It leverages AI to analyze resumes against real job descriptions, identify skill gaps, generate tailored interview questions, and provide actionable suggestions — all in one seamless interface.

The application supports PDF resume uploads, LinkedIn profile imports via OAuth, and provides a comprehensive dashboard to track analysis history over time.

---

## Key Features

### Resume Upload & Parsing
- Upload resume as a PDF file via drag-and-drop or file picker
- Automatic text extraction and parsing from uploaded PDFs
- Secure file storage with Cloudinary integration (no local storage)
- Resume history saved per user account

### ATS Score & Job Description Matching
- Paste any job description and get an instant ATS compatibility score
- Visual match percentage with matched and missing keyword breakdown
- Powered by AI for intelligent semantic matching
- Robust JSON parsing — handles malformed AI responses gracefully with local fallback

### Skill Gap Analysis & Suggestions
- Identifies skills present in the job description but missing from the resume
- Provides actionable recommendations to bridge skill gaps
- Prioritized suggestion cards for quick improvement planning

### Interview Question Generator
- Generates role-specific interview questions based on resume + job description
- Questions categorized by type: Technical, Behavioral, HR
- Difficulty badges (Easy / Medium / Hard) for each question
- Built-in countdown timer for mock interview practice
- Falls back to a rich local question bank if no AI key is configured

### LinkedIn Profile Import
- OAuth 2.0 LinkedIn integration using **OpenID Connect** (`openid profile email` scopes)
- Uses `/v2/userinfo` endpoint (modern API — not deprecated `/v2/me`)
- Displays real imported user name and email after successful connect
- Upload and LinkedIn tabs maintain **independent state** — results don't bleed across tabs
- Seamless toggle between PDF upload and LinkedIn import

### Dashboard & History
- Personalized dashboard showing all past resume analyses
- View, revisit, or delete previous analysis sessions
- ATS score badges and timestamps for each entry

### Authentication
- Secure user registration and login with JWT-based authentication
- Passwords hashed with bcrypt
- Protected routes — all features require login

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing and protected routes |
| Axios | HTTP client with cookie credentials |
| Context API | Global auth and resume state management |
| Tailwind CSS | Utility-first styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Database and ODM |
| Groq (Llama 3) / Gemini  | Multi-provider AI with automatic fallback |
| Multer + Cloudinary | PDF upload handling and cloud storage |
| JWT + bcryptjs | Authentication and password security |
| pdf-parse | PDF text extraction |
| express-rate-limit | API rate limiting |

---

## AI Service Architecture

The app uses a **multi-provider AI system with automatic fallback**:

```
1st → Groq (llama3-8b-8192)     ← fastest, most free requests (14,400/day)
2th → Local fallback             ← built-in question bank, keyword matching
```

- Only **one API key is needed** — add any one and it works automatically
- Startup log shows which AI service is active:
  ```
  ✅ AI Service: Groq (llama3-8b-8192)
  ```
- AI responses are sanitized before JSON parsing to handle markdown fences, dashes, and plain-text prefixes

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ ATS Page │  │Dashboard │  │Interview │  │  Auth  │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP / Axios (withCredentials)
┌───────────────────────▼─────────────────────────────────┐
│                 Express.js REST API                      │
│  /api/auth   /api/resume   /api/jd   /api/interview      │
│  /api/history              /api/linkedin                 │
└──────────┬──────────────────┬──────────────┬────────────┘
           │                  │              │
┌──────────▼────────┐ ┌───────▼──────┐ ┌────▼───────────┐
│  MongoDB Atlas    │ │  AI Provider  │ │   Cloudinary   │
│  (Users, Resumes, │ │  Groq         │ │  (PDF Storage) │
│   History)        │ │        /Local │ └────────────────┘
└───────────────────┘ └──────────────┘
```

---

## API Endpoints

### Auth Routes — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Register a new user |
| POST | `/login` | ❌ | Login and receive JWT cookie |
| GET | `/profile` | ✅ | Get logged-in user profile |
| PUT | `/profile` | ✅ | Update user profile |

### Resume Routes — `/api/resume`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/upload` | ✅ | Upload PDF resume (multipart/form-data) → stored on Cloudinary |
| GET | `/` | ✅ | Get all resumes for logged-in user |
| GET | `/:id` | ✅ | Get a specific resume by ID |
| DELETE | `/:id` | ✅ | Delete a resume |

### JD Match Routes — `/api/jd`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/match` | ❌ | Match resume text vs job description |
| POST | `/skillgap` | ❌ | Get skill gap analysis |

**Request body for both:**
```json
{
  "resumeText": "full resume text string",
  "jobDescription": "full job description string"
}
```

### Interview Routes — `/api/interview`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/generate` | ❌ | Generate interview questions from resume + JD |
| GET | `/:resumeId` | ❌ | Get previously generated questions by resume ID |

**Request body for generate:**
```json
{
  "resumeText": "full resume text string",
  "jobDescription": "optional job description"
}
```

### History Routes — `/api/history`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | Get all analysis history for logged-in user |
| GET | `/:id` | ✅ | Get a specific history entry |
| DELETE | `/:id` | ✅ | Delete a history entry |

### LinkedIn Routes — `/api/linkedin`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/callback` | ❌ | Handle LinkedIn OAuth callback (`?code=xxx`) |
| POST | `/import` | ❌ | Import profile using access token |

> **Note:** LinkedIn integration uses the OpenID Connect product and `/v2/userinfo` endpoint. Required scopes: `openid profile email`

---

## Project Structure

```
RozgaarAi/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ats/              # FileDropzone, ScorePanel, JobRoleSelector,
│   │   │   │                     # SuggestionCard, SuggestionsPanel, LinkedinImport
│   │   │   ├── dashboard/        # Dashboard UI components
│   │   │   ├── home/             # HeroSection, HowItWorks, FeaturePills
│   │   │   ├── interview/        # QuestionCard, CategoryTabs, CountdownTimer
│   │   │   ├── layout/           # Navbar, Sidebar, Footer, AppLayout
│   │   │   └── ui/               # Button, Card, Badge, Input, ScoreRing, Skeleton
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state
│   │   ├── hooks/                # useAuth, useResume, useScore, useInterview, useTimer
│   │   ├── lib/
│   │   │   └── axios.js          # Axios instance with baseURL + credentials
│   │   ├── pages/                # ATSPage, DashboardPage, HomePage,
│   │   │                         # InterviewPage, LoginPage, RegisterPage
│   │   ├── services/             # resumeService, jdService, historyService,
│   │   │                         # interviewService, linkedinService
│   │   └── App.jsx               # Routes configuration
│   └── package.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   │   ├── db.js             # MongoDB connection
    │   │   ├── cloudinary.js     # Cloudinary setup
    │   │   └── gemini.js         # Google Gemini AI setup
    │   ├── controllers/          # auth, resume, jd, interview, linkedin, history
    │   ├── middleware/           # auth.middleware, errorHandler, rateLimiter
    │   ├── models/               # User, Resume, ResumeHistory mongoose models
    │   ├── routes/               # auth, resume, jd, interview, linkedin, history routes
    │   └── services/             # ai, parser, storage, fileUpload,
    │                             # jdMatch, skillGap, interview, linkedin services
    ├── server.js                 # Express app entry point
    └── package.json
```

> **Note:** The local `uploads/` folder has been removed. All files are stored on Cloudinary.

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- At least **one** AI API key — Groq (recommended, free), Gemini, or OpenAI
- Cloudinary account (free tier)
- LinkedIn Developer App (for OAuth import feature)

### 1. Clone the repository
```bash
git clone https://github.com/sankeerthanaaa/Rozgaar-AI.git
cd Rozgaar-AI
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key

# AI Services — add at least ONE key (Groq recommended, free at console.groq.com)
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Cloudinary (free at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:5173/linkedin/callback
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_LINKEDIN_CLIENT_ID=your_linkedin_client_id
```

Start the frontend:
```bash
npm run dev
```

### 4. LinkedIn Developer App Setup
1. Go to [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps)
2. Create or open your app → **Auth** tab
3. Add redirect URL: `http://localhost:5173/linkedin/callback`
4. Go to **Products** tab → Request access to **"Sign In with LinkedIn using OpenID Connect"**
5. Copy your **Client ID** and **Client Secret** into both `.env` files

### 5. Open in browser
```
http://localhost:5173
```




---

<div align="center">
  <p>by Team Rozgaar-AI</p>
</div>
