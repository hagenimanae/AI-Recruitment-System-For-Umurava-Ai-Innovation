 HEAD
# AI-Recruitment-System-For-Umurava-Ai-Innovation
AI-recruit This Is AI-recruitment system which screen and shortlist candidate based on AI-Screening using real Gemin api key And It explain why candidate choosen

# AI-Powered Recruitment System

## Overview
End-to-end recruitment platform that automatically screens and shortlists candidates using Google's Gemini AI. Built for the Umurava AI Innovation Challenge.

**Live Demo**: [https://ai-recruitment-system-for-umurava-a-mu.vercel.app/]  | [https://ai-recruitment-system-for-umurava-ai.onrender.com/] expected output(cannot get means backend is running)

Logins as admin to create job and add applicant and also add ai screening
Logins as recruit to view available job and apply for that available job and see ai screening result through my applicant  
---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js 16    │────▶│  Node.js + Express│────▶│   MongoDB Atlas │
│   (Frontend)    │     │   (Backend)       │     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                        │
         │                        ▼
         │              ┌──────────────────┐
         │              │  Google Gemini   │
         └─────────────▶│  AI Screening    │
                        └──────────────────┘
```

### AI Decision Flow

```
Job Requirements ──┐
                   ├──▶ Gemini API Batch Prompt ──▶ Structured JSON
Talent Profiles ───┘                                     (Score 0-100)
Resume PDFs ───────┐                                    ├─ Strengths[]
CSV Bulk Import ───┘                                    ├─ Gaps[]
                                                        ├─ Reasoning
                                                        └─ Recommendation
                                                                │
                                                                ▼
                                                   ┌────────────────────┐
                                                   │  Ranked Shortlist  │
                                                   │   (Top 10/20)      │
                                                   └────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas |
| AI | Google Gemini API (gemini-1.5-flash) |

---

## Quick Start

```bash
# 1. Clone & Setup
git clone <repo-url>
cd AI-recruitmentsystem

# 2. Environment (copy .env.example)
cp .env.example backend/.env
cp .env.example frontend/.env.local
# Add GEMINI_API_KEY to both

# 3. Install & Run
cd backend && npm install && npm run dev    # Terminal 1
cd frontend && npm install && npm run dev   # Terminal 2

# App runs at http://localhost:3000
```

---

## AI Implementation

### Prompt Engineering Strategy

**System Instruction**: "You are an expert technical recruiter analyzing candidates against job criteria."

**Prompt Structure**:
1. Job details (title, skills, requirements, experience)
2. Structured candidate profiles (Talent Profile Schema)
3. Evaluation criteria with weights
4. Required JSON output format with schema

**Model Strategy**:
- Primary: `gemini-1.5-flash` (fast, cost-effective)
- Fallback chain: flash-8b → pro → local scoring
- Retry with 15s delay on rate limits (3 attempts)

**Output Schema**:
```json
{
  "applicantId": "string",
  "score": "number (0-100)",
  "strengths": ["string"],
  "gaps": ["string"],
  "recommendation": "Highly Recommended | Interview | Reject",
  "reasoningText": "string"
}
```

### Fallback Mechanism
If Gemini fails/rate-limited, system falls back to local keyword matching algorithm ensuring 100% uptime.

---

## Scenario Coverage

| Requirement | Implementation |
|-------------|----------------|
| **Scenario 1: Umurava Platform** | Structured JSON talent profiles via form paste |
| **Scenario 2: External Job Boards** | PDF upload, CSV bulk import, resume URL links |
| **Batch Analysis** | Multiple candidates evaluated in single Gemini prompt |
| **Ranking** | Sorted by match score (0-100) with rank assignment |
| **Explainability** | Strengths, gaps, reasoning text per candidate |
| **Top 10/20 Shortlist** | Filtered and ranked results display |

---

## API Reference

```
Jobs        GET    /api/jobs
            POST   /api/jobs
            GET    /api/jobs/:id
            PUT    /api/jobs/:id
            DELETE /api/jobs/:id

Applicants  GET    /api/applicants/:jobId
            POST   /api/applicants/:jobId      (JSON/PDF/URL)
            POST   /api/applicants/:jobId/bulk (CSV)

AI          POST   /api/ai/:jobId/screen
            GET    /api/ai/:jobId/results
```

---

## Deployment

| Component | Platform | Link |
|-----------|----------|------|
| Frontend | Vercel | [https://vercel.com/]|
| Backend | Railway/Render | [https://render.com/]|
| Database | MongoDB Atlas | [Setup](https://mongodb.com/atlas) |

**Environment Variables**:
- `GEMINI_API_KEY` (required)
- `MONGO_URI` (required for production)
- `NEXT_PUBLIC_API_URL` (frontend)
- `FRONTEND_URL`, `PORT=5000` (backend)

---

## Team Composition

Built with required 3+ roles:
- **Front-End Engineer**: Next.js, Redux, Tailwind UI
- **Back-End Engineer**: Node.js, MongoDB, API design
- **AI Software Engineer**: Gemini integration, prompt engineering, scoring

---

## Assumptions & Limitations

| Item | Details |
|------|---------|
| PDF Parsing | Text-searchable only (no OCR) |
| Batch Size | Gemini context limits apply (>100 candidates may need chunking) |
| URL Resumes | Link storage only (no auto-fetch) |
| Auth | JWT-based role access (admin/recruiter) |

---

## Submission Checklist

- ✅ Deployed web application
- ✅ Functional AI-powered screening
- ✅ Recruiter-facing interface
- ✅ 2-slide presentation
- ✅ Technical documentation (this README)

---

**Built for the Umurava  AI Innovation Challenge  hackton by Quantum coder Lead By HAGENIMANA ELISSA**
3594dc5 (first commit)
