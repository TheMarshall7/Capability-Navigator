# Capability Navigator

> Discover what you're capable of becoming — not just what you've already done.

---

## What This Is

Capability Navigator is an AI-powered capability discovery and career transition platform.

It is **not** a job board.  
It is **not** a recruiter.  
It is **not** a personality test.

Its purpose is to help users understand what they are genuinely capable of becoming — based on their CV, work history, interests, hobbies, values, work style, and goals. The emotional target is for users to say: *"This understands me better than my CV."*

---

## Core Philosophy

**People are not job titles.**  
CVs mostly show what someone has done, not what they could become. A teacher's CV looks like a teacher's CV — it doesn't reveal the instructional designer, the product manager, or the customer success professional hiding inside eight years of complex human work.

**The app should:**
- Identify transferable capabilities and hidden strengths
- Suggest realistic career pathways the user may not have considered
- Generate a transition roadmap that is practical, low-cost, and achievable
- Use hobbies, interests, and side projects as genuine evidence of capability
- Never rank, score, or reject a human being

**The tone must be empowering, not judgemental.**  
Every piece of output should read like it was written by a brilliant, honest mentor — not an algorithm sorting people into buckets.

---

## Version 1 User Journey

```
1. Landing page
2. Sign up / log in
3. Upload or paste CV
4. Complete 7-section questionnaire (~20 minutes)
5. AI generates capability profile (30–60 seconds)
6. View capability profile (summary, core caps, hidden strengths, work style)
7. View 3–5 career pathway suggestions
8. Select a pathway and view full transition roadmap
9. Give feedback on accuracy (Capability Validation Score)
10. Create share link
11. Friend/colleague/mentor reviews profile and leaves validation
```

---

## Project Structure

```
capability-navigator/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── generate-profile/   ← Core AI endpoint
│   │   │   ├── feedback/           ← Store user feedback
│   │   │   ├── share-links/        ← Create/read share links
│   │   │   └── mentor-feedback/    ← Public endpoint (no auth)
│   │   ├── dashboard/
│   │   ├── cv-upload/
│   │   ├── questionnaire/
│   │   ├── generating/
│   │   ├── profile/
│   │   ├── pathways/
│   │   ├── roadmap/
│   │   ├── feedback/
│   │   ├── share/
│   │   ├── settings/
│   │   └── p/[token]/              ← Public shared profile view
│   ├── lib/
│   │   ├── ai-service.ts           ← THE AI PROMPT LIVES HERE
│   │   ├── supabase-server.ts
│   │   └── supabase-browser.ts
│   ├── types/
│   │   └── index.ts                ← All TypeScript types
│   └── components/
│       ├── ui/                     ← Shared UI components
│       └── layout/                 ← Nav, layout wrappers
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← DATABASE SCHEMA LIVES HERE
├── .env.local.example
├── package.json
└── README.md
```

---

## Developer Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Then fill in these values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-key-here             # Optional — see mock data section
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API** and copy your URL and anon key
3. Run the schema in the Supabase SQL editor:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Paste the entire file into the Supabase SQL editor
   - Click **Run**
4. Enable email auth in **Authentication → Providers**

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Where the AI Prompt Lives

**`src/lib/ai-service.ts`** — this is the most important file in the project.

It contains:
- `SYSTEM_PROMPT` — the complete instructions given to the AI including philosophy, language rules, tone, and protected characteristic rules
- `buildUserPrompt()` — assembles the CV text and questionnaire answers into a structured prompt
- `generateCapabilityReport()` — the main exported function called by the API route
- `getMockReport()` — the high-quality demo teacher profile used as fallback

**To modify the AI behaviour, edit `SYSTEM_PROMPT` and `buildUserPrompt()` in this file.**

---

## How Mock Data Works

If `GEMINI_API_KEY` is not set in `.env.local`, the app automatically returns the mock teacher demo profile. This means:

- The full UI can be built, tested, and demoed without any API costs
- The mock data represents the "teacher wanting a career change" demo specified in the build requirements
- Pathways shown: Learning Designer, Customer Success Manager, Product Manager, Training Consultant, Operations Coordinator
- To test with real AI, simply add a `GEMINI_API_KEY` to `.env.local`

**To test the demo profile flow:**
1. Leave `GEMINI_API_KEY` unset
2. Create an account, upload any CV (or skip), complete questionnaire
3. The system returns the high-quality mock profile

---

## Gemini Configuration

- Model: `gemini-2.0-flash` (default; override with `GEMINI_MODEL` in `.env.local`)
- API key: [Google AI Studio](https://aistudio.google.com/apikey)
- Profile generation uses JSON mode (`responseMimeType: application/json`)
- Coach chat uses streaming via `generateContentStream`
- Gemini Flash is typically lower cost than GPT-4o for development and production

The system prompt was originally written for GPT-4o. Minor prompt tuning may help if JSON output is occasionally malformed.

---

## Data Model

### users
Extends Supabase Auth. Stores name and email alongside the auth user ID.

### profiles
Stores answers from Section 1 of the questionnaire (role, experience, situation, location, working arrangements). These are the structured fields — the rest of the questionnaire is in `questionnaire_answers`.

### cv_uploads
Stores CV file metadata and extracted text. The `extracted_text` field is what gets sent to the AI. File lives in Supabase Storage (private bucket `cv-uploads`).

### questionnaire_answers
Key-value storage for all 28 questionnaire questions. Using `jsonb` for `answer_value` means arrays, numbers, and strings all fit in the same column. One row per question per user. Re-answering a question upserts the existing row.

### capability_reports
The full AI-generated output. Capabilities and strengths are stored as JSONB arrays. One report per user (replace on regeneration, or append with a new row if you want version history).

### career_pathways
Each of the 3–5 suggested pathways. Linked to a `capability_report`. The full roadmap object is stored as JSONB in `roadmap_json`.

### feedback
The five-question feedback form. One row per submission. Used to calculate the Capability Validation Score.

### share_links
Tokenised links with three visibility states: `private` (only owner), `shareable` (anyone with link, read-only), `mentor` (anyone with link can submit feedback). Token is a 32-character random hex string.

### mentor_feedback
Linked to a `share_link`. No auth required for insertion in V1. Owners can read their own mentor feedback via the share link relationship.

---

## Questionnaire

7 sections, 28 questions:

1. **Basic Career Context** — role, years, situation, location, arrangements
2. **Aspiration & Direction** — 5-year vision, curiosities, priorities
3. **Energy & Motivation** — energising activities, draining activities, proud moments
4. **Hobbies & Hidden Capabilities** — hobbies, side projects, self-education
5. **Work Style** — environment, collaboration, uncertainty, planning style
6. **Change & Upskilling** — openness to retraining, time available, salary flexibility, timeline
7. **Self-Perception** — strengths, overlooked capabilities, ideal future

**The questionnaire surfaces what CVs cannot. Sections 4 and 7 are where the most valuable hidden capability data comes from.**

---

## AI Output Structure

The `generateCapabilityReport()` function returns:

```typescript
{
  capabilitySummary: string              // 3–4 sentence overview
  coreCapabilities: [                    // 6 items
    { title, explanation, evidence }
  ]
  hiddenStrengths: [                     // 4 items
    { title, explanation }
  ]
  workStyleSummary: string
  cvUnderrepresentationSummary: string
  careerPathways: [                      // 5 pathways
    {
      title, matchReason, capabilityOverlap, missingSkills,
      difficulty, estimatedTransitionTime, firstStep,
      roadmap: {
        startingPoint, targetCareer, existingStrengths, skillGaps,
        suggestedLearning, portfolioEvidence, entryRoutes,
        jobSearchTerms, firstThreeActions,
        threeMonthPlan, sixMonthPlan, twelveMonthPlan
      }
    }
  ]
}
```

---

## Privacy and Trust

**Version 1 hard rules:**

- Do NOT collect demographic or protected characteristic data
- Do NOT ask for religion, ethnicity, health conditions, sexuality, disability, or political views
- Do NOT sell personal data (ever)
- Users must be able to delete their CV and account from Settings
- AI output is guidance — not a final judgement
- Do NOT allow employers to filter users by protected characteristics
- Do NOT use language that makes users feel scored, ranked, or rejected

**Language rules:**
- Use: "current overlap", "possible pathway", "capability gap", "suggested next step", "evidence from your experience"
- Avoid: "unsuitable", "low value candidate", "rejected", "personality score"

---

## Capability Validation Score (Internal Metric)

Calculated from feedback submissions:

| Metric | Source |
|--------|--------|
| Accuracy (high) | % of users rating accuracy 4 or 5 |
| Revealed something new | % selecting "Yes" |
| Would share | % selecting "Yes" or "Maybe" |

**Version 1 success = users feel understood, not job applications filed.**

---

## Shareable Reports

Users can create share links with three states:

- **Private** — only the owner can view
- **Shareable** — anyone with the link can view (read-only)
- **Mentor review** — anyone with the link can view AND submit feedback

Reviewers do not need an account in Version 1.

Shared content includes: capability summary, core capabilities, hidden strengths, selected pathway, roadmap summary.

---

## Future Roadmap (Not V1)

Do not build these into Version 1:
- Live job board API integrations
- Course purchase or referral monetisation
- LinkedIn import (requires OAuth, user consent workflow)
- Employer portal or employer-side filtering
- Progress tracking across time
- Career transition cohort data / workforce intelligence
- Government or employment service API integrations

---

## Deploy

### Vercel (recommended)

1. Connect the GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Leave **Build command** as `next build` (default)
3. Add these environment variables for **Production** and **Preview**:

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `NEXT_PUBLIC_APP_URL` | Yes — your Vercel URL (e.g. `https://your-app.vercel.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes — server-only |
| `GEMINI_API_KEY` | Optional — mock data used if missing |

4. In Supabase → Authentication → URL configuration, add:

`https://YOUR-VERCEL-URL/api/auth/callback`

Or deploy from CLI:

```bash
npm install -g vercel
vercel
```

### Cloudflare Pages

The **`next build` in your log succeeded** — the failure is only the output folder. Cloudflare is looking for `out` (static export), but this app needs the Cloudflare adapter output at **`.vercel/output/static`**.

After pulling latest `main`, `wrangler.toml` sets the correct output directory. In **Cloudflare → Settings → Build**:

| Setting | Value |
|---------|-------|
| **Build command** | `npx next build` *(shim auto-runs adapter on CF)* or `npm run pages:build` |
| **Build output directory** | **Leave blank** or set to `.vercel/output/static` — **not `out`** |

Add the same Supabase/Gemini env vars as Vercel. Set `NEXT_PUBLIC_APP_URL` to your `*.pages.dev` URL.

### Self-hosted

```bash
npm run build
npm start
```

Requires Node.js 18+.

---

## Important Warning

**Do not turn this into a generic job board.**

The core value of Capability Navigator is capability discovery and career transition mapping. The moment it becomes a job matching service or a recruiter tool, it loses its entire reason to exist.

The platform competes with self-reflection and career coaches — not with LinkedIn or Indeed. That is the correct moat. Protect it.

Every feature decision should be filtered through one question: *Does this help users understand what they are capable of becoming?* If not, it does not belong in this product.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Google Gemini |
| Deployment | Vercel or Cloudflare Pages |

---

*Built with Capability Navigator v0.1.0*
