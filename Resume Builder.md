# Capability Navigator — CV/Résumé Optimization Knowledge Reference

**Purpose:** Internal knowledge file for the Capability Navigator AI. This document tells the AI what to look for in a CV, what to change, and how to optimize it — across UK, North American, and international standards — with a heavily weighted section on career-changers. Directives use the convention: **ALWAYS X**, **NEVER Y**, **WHEN Z, DO W**.

---

## 0. Core Operating Principles (read first)

- **ALWAYS treat the CV as two audiences at once:** the ATS parser (machine) and the recruiter (human, ~7.4-second first scan). Optimize for both; never sacrifice one for the other.
- **ALWAYS default to reverse-chronological format** unless the user is a career-changer, returning from a long gap, or has a fragmented contract history — in which case use **combination/hybrid** (never pure functional).
- **ALWAYS tailor to a specific job description.** A generic CV is the single most common and costly failure mode. Mirror the posting's exact vocabulary where it is truthful.
- **ALWAYS quantify outcomes** where possible; lead with results, not duties.
- **NEVER use pure functional (skills-only) format** — recruiters distrust it and ATS parsers mishandle it.
- **NEVER fabricate.** Reframe and translate genuine experience; do not invent it.
- **WHEN the user states a target country, apply that region's conventions** (length, photo, personal details, terminology) from Section 3.
- **ALWAYS preserve a human voice.** AI-generated, un-personalized CVs are now a recruiter red flag.

---

## 1. How Recruiters Actually Read a CV (behavioral research)

- **The 7.4-second scan.** The Ladders, Inc. 2018 Eye-Tracking Study (update of its 2012 six-second study) found: "The average initial screening time for a candidate's resume clocks in at just 7.4 seconds—an improvement on the six-second average screening time found in 2012." This is a *decision window*, not a full read. (Note methodological limits: small sample of ~30 recruiters; the F-pattern itself is independently validated by Nielsen Norman Group research on web reading.)
- **F-pattern / top-third / golden-triangle reading.** Recruiters scan across the top, then down the left margin. Attention concentrates on the top third of page one and the left-hand side.
- **What they look at first, in order:** current/most recent job title → company name → employment dates → first bullet under most recent role → education. The name gets only a brief identification glance.
- **Two-phase process:** Phase 1 = pattern recognition (title + company + dates). Phase 2 = decide whether to invest 2–3 minutes on a deeper read. Dense paragraphs are largely skipped in Phase 1.

**Directives:**
- **ALWAYS put the most decision-relevant information (target title, current title, key achievement) in the top third of page one, left-aligned.**
- **ALWAYS make job titles, companies, and dates instantly scannable** (bold titles, consistent placement).
- **NEVER bury the strongest current title beneath a long summary paragraph.**
- **ALWAYS use a one-line headline-style summary rather than a 3–4 sentence dense block** at the very top, because summary paragraphs lose attention in the first scan.

---

## 2. ATS Optimization (how parsing really works)

### 2.1 The ATS pipeline
1. **Extraction/Parsing** — the system reads the text layer and breaks it into fields: Job Title, Company, Start/End Date, Description, Skills, Education.
2. **Categorization** — it sorts data into structured fields (e.g., "January 2018–April 2022" → date range).
3. **Indexing** — your data becomes a searchable database entry.
4. **Ranking/Matching** — it scores relevance against the job description, heavily weighting keyword matches. Recruiters then sort by match score and typically review only the top 30–50 candidates.

**Key mental model:** The ATS does not usually "auto-reject." It ranks. A poorly parsed or low-keyword CV sinks to position ~180 and is never opened — functionally a rejection.

### 2.2 What breaks parsers (NEVER do these for ATS-bound CVs)
- **NEVER use multi-column layouts or sidebars.** Parsers read left-to-right, top-to-bottom; columns scramble into "word salad." In testing across 8 ATS platforms, two-column content merged into a scrambled sequence and sidebar content (skills, contact info) was dropped entirely by multiple systems.
- **NEVER use tables** to lay out skills or experience — content inside tables is partially extracted or skipped.
- **NEVER put contact info, names, or key data in headers/footers** — many parsers cannot read them.
- **NEVER use text boxes, SmartArt, shapes, graphics, logos, progress bars, or skill-rating star graphics** — the ATS sees nothing or garbage.
- **NEVER use icons in place of text labels** (use "Phone:", "Email:", "LinkedIn:").
- **NEVER rename standard section headings.** "My Journey" instead of "Work Experience" drops the entire section into the void. Use exactly: **Work Experience / Professional Experience, Education, Skills, Certifications, Summary.**
- **NEVER use decorative or non-system fonts** — they can render as gibberish.

### 2.3 What works (ALWAYS do these)
- **ALWAYS use a single-column layout.**
- **ALWAYS use standard section headings.**
- **ALWAYS use standard bullets (•, -)**; avoid custom symbols, checkmarks, arrows.
- **ALWAYS use "Month YYYY – Month YYYY" date format** (e.g., "Jan 2020 – Mar 2023"); it parsed correctly across all tested systems. Keep date formats consistent.
- **ALWAYS use the "umbrella" method for multiple roles at one employer** — list the company once so the ATS attributes all roles correctly.
- **ALWAYS list skills as a comma-separated or vertical-bar (|) list**, not in a table or column.
- **ALWAYS spell out acronyms with the full term once** (e.g., "CPA (Certified Public Accountant)") so both forms are searchable.
- **ALWAYS keep visible hyperlink URLs** (linkedin.com/in/name), not hidden "click here" links.

### 2.4 File format
- **DOCX parses most reliably** across the widest range of ATS (it is the native parser language), especially for stricter Workday setups.
- **Text-based PDF** preserves formatting and is safe for ~90% of modern ATS, but design-heavy PDF exports (Canva, Illustrator) can scramble the text layer.
- **WHEN the employer specifies a format, follow it exactly.** WHEN unsure, prefer DOCX. NEVER submit image-only PDFs, .pages, or .odt.

### 2.5 Keyword strategy — exact-match vs. semantic
- Many ATS still rely on **exact-string matching**; they do not reliably recognize synonyms (e.g., "Adobe Creative Cloud" vs "Adobe Creative Suite," or "worked across teams" vs "cross-functional collaboration"). Some modern engines do semantic matching, but **NEVER rely on it.**
- **ALWAYS mirror the job description's exact terminology** where it truthfully describes the candidate's experience.
- **Keyword placement matters:** keywords in a properly labeled Skills section and in titles carry more weight than the same words buried in bullets (confirmed in 5 of 8 tested systems). **ALWAYS surface priority keywords in both the Skills section and within experience bullets.**
- **NEVER keyword-stuff.** Rule: if a word could describe anyone, replace it with scope + tool/method + metric.
- Recruiters increasingly search the ATS database by skills (per LinkedIn, recruiters with paid licenses search by skills roughly five times more often than by degrees). Skills must therefore appear as discrete, searchable terms.

---

## 3. Geographic Standards

### 3.1 United Kingdom
- **Term:** Always call it a **CV** (not résumé). Use **British English** spelling throughout (organise, optimise, colour, programme, centre).
- **Length:** **Two pages of A4** is the standard for experienced candidates. One page acceptable for those with under ~2 years' experience. Three pages only for senior/academic.
- **Photo:** **NEVER include a photo** (sole exceptions: acting, presenting, modelling). UK employers avoid photos to prevent discrimination claims under the Equality Act 2010.
- **Personal details:** **NEVER include date of birth, age, marital status, nationality, religion, gender, or full home address.** Include city + general area only (e.g., "Manchester, UK") plus phone and professional email.
- **Personal statement / profile:** A concise positioning statement (2–4 lines; per Prospects, **no longer than ~150 words**) directly under contact details. Should answer: who you are, what you're good at, what you're targeting. Tailor it per application. Per Prospects, it can be written in first or third person but must stay consistent. (Note: in HECSU/Prospects employer research, roughly three-quarters of graduate employers wanted to see a personal profile, but about one quarter disliked them — specifically because applicants made unevidenced claims. So make it specific and evidenced.)
- **Structure:** Contact → Personal profile → (Key skills) → Work experience (reverse-chron) → Education → optional Additional (languages, volunteering, awards).
- **References:** **NEVER list referees.** Write "References available on request" or omit entirely.
- **ATS:** Most medium/large UK employers and agencies use ATS. Same formatting rules as Section 2. Healthcare and teaching often use application-portal forms rather than standalone CVs.
- **LinkedIn:** UK recruiters routinely cross-check CV against LinkedIn. Dates, titles, employers **must match exactly.**
- **Format choice:** Reverse-chronological is the expected norm; functional CVs "raise suspicion."

### 3.2 North America (US & Canada)
- **Term:** "**Résumé**" is the standard job-application document (1–2 pages). "**CV**" in the US/Canada means a long academic document with publications. NEVER submit an academic CV for an industry job.
- **Length:** One page for early/mid career (rule of thumb: ~one page per 10 years of experience). Two pages acceptable and common for 10+ years/senior/technical roles. NEVER pad; NEVER spill 1.1 pages — either cut to one clean page or fill two. (Note: USAJobs federal applications introduced a two-page maximum effective Sept 27, 2025.)
- **Photo & personal details:** **NEVER include photo, date of birth, marital status, or nationality** (US/Canada). Include name, phone, professional email, city/state (or city/province), LinkedIn.
- **Summary vs objective:** Use a **professional summary** (achievement-focused) for those with experience; reserve an **objective** for entry-level or pure career-changers signaling direction.
- **Spelling:** US English for US; Canadian English (largely British-style spellings) acceptable for Canada.
- **ATS:** Near-universal among large employers. Apply all of Section 2.

### 3.3 International (by region)

| Region | Term | Length | Photo | Personal details (DOB, nationality, marital) | Notes |
|---|---|---|---|---|---|
| **UK** | CV | 2 pp | No | No | British spelling; no references listed |
| **US** | Résumé | 1–2 pp | No | No | One page per ~10 yrs; CV = academic only |
| **Canada** | Résumé/CV | 1–2 pp | No | No | Bilingual (Eng/Fr) may help in Quebec |
| **EU (Europass)** | CV | 1–3 pp | Optional (built-in) | Optional fields available | Official EU template; standardized headings; CEFR language grid; no summary section |
| **Germany/Austria/Switzerland** | Lebenslauf | 1–2 pp | **Expected** | **DOB, nationality expected** | Tabular, formal; often signed/dated |
| **France/Southern EU** | CV | 1–2 pp | Commonly expected | Often included | Photo norm in France |
| **Nordics** | CV | 1–2 pp | Mixed (Denmark yes; Norway no) | Minimal | Concise, bullet-driven |
| **Poland/Italy** | CV | 1–2 pp | Expected | Included | **Must include GDPR/RODO consent clause** or application cannot be processed |
| **Australia/NZ** | Résumé/CV (interchangeable) | 2–4 pp (longer than US) | No | No | Achievement-focused; "selection criteria" responses common in public sector |
| **Gulf/GCC (UAE, KSA, Qatar)** | CV | 2–4 pp | **Standard headshot** | **Nationality + visa status MANDATORY**, DOB, marital often | Visa/nationality used for work-authorization & Emiratization/Saudization quotas; missing = instant reject |
| **Japan** | Rirekisho | Standardized form | **Required** | **DOB, gender required** | Standardized template; often a separate "Entry Sheet" |
| **China** | Résumé/CV | 1 p | Standard | DOB standard | Concise |
| **India** | CV/résumé/biodata | 2–3 pp | Varies | Sometimes included | Terms used interchangeably |
| **Singapore/Hong Kong** | CV/résumé | 1–2 pp | Discouraged | Omit age/ID (Singapore guidance) | Western-style |

**Europass directives:**
- **WHEN applying to EU institutions, public sector, academic grants, or Erasmus+, OR when the employer explicitly requests it, USE Europass** (europass.europa.eu).
- **WHEN applying to EU private-sector/competitive roles, PREFER local-convention CVs** — a generic Europass can read as impersonal and may trigger parsing errors in corporate ATS.
- **ALWAYS use the CEFR scale (A1–C2) for languages** on any European CV.
- Note: Europass has **no personal-statement/summary section** by design.

---

## 4. High-Converting Structure & Section Order

**Default order (reverse-chronological, experienced candidate):**
1. **Header** — Name (largest), city/area, phone, professional email, LinkedIn URL. (No photo in UK/US/CA/AU.)
2. **Headline/Title** — target role identity (one line).
3. **Professional Summary / Personal Profile** — 2–4 lines (UK ≤150 words), tailored.
4. **Core Skills** — 6–10 job-relevant keywords (hard + a few soft), mirroring the posting.
5. **Work Experience** — reverse-chronological; title, company, location, dates; achievement bullets.
6. **Education** — degree, institution, year; grade if recent/relevant.
7. **Optional** — Certifications, Projects, Volunteering, Languages, Awards.

**Directives:**
- **WHEN the candidate is a recent graduate or has <2–3 years' experience, place Education above Work Experience.** Otherwise Education goes below.
- **ALWAYS give the most relevant/recent roles the most bullets** (most recent: 4–5; next: 3–4; older: 1–2; oldest/irrelevant: one line). Older than ~10–15 years can be condensed or dropped.
- **Summary vs Objective:** Summary = "what I've achieved" (default). Objective = "where I'm going" (entry-level / career-change only).

---

## 5. Bullet-Point Craft

### 5.1 Frameworks
- **Google XYZ formula:** "**Accomplished [X] as measured by [Y] by doing [Z]**" (Laszlo Bock, ex-Google SVP People Ops). Example: "Increased sales (X) by 25% (Y) by launching a new line of business in Q1 (Z)." Order is flexible; lead with the metric if it's impressive.
- **STAR** (Situation, Task, Action, Result) — most flexible; full story or single bullet.
- **CAR** (Challenge, Action, Result) — quicker; near-identical to STAR.
- **PAR** (Problem, Action, Result) — tightest; good for earlier/operational roles.
- **Unifying rule:** every strong bullet = **action verb + what you did (scope) + result/outcome.** If a bullet can't pass that test, rewrite or cut it.

### 5.2 Quantification
- **ALWAYS lead with outcome, not duty.** "Responsible for answering calls" → "Resolved customer inquiries with a 92% first-call resolution rate."
- **WHEN hard numbers aren't available, quantify with:** scope (team size, budget, volume), frequency (weekly/monthly counts), relative change ("reduced from days to hours"), or qualitative-but-concrete outcomes ("received Employee of the Month," "adopted by a 50-person team"). Use conservative estimates ("approximately," "over") when exact figures are unknown.
- **NEVER make every bullet a metric-stuffed clone** — vary, and not every bullet needs a number (creative/admin roles especially).

### 5.3 Language & word choice
- **ALWAYS start each bullet with a strong action verb in active voice.**
- **Tense:** present tense for current role, past tense for prior roles.
- **NEVER use first-person pronouns** ("I", "my") in bullets; use implied first person.
- **NEVER use "Responsible for", "Duties included", "Worked on", "Helped"** as bullet openers.
- **NEVER include "References available upon request"** on US/CA résumés (waste of space; UK optional).

**Weak phrase → strong replacement table:**

| Weak / cliché | Replace with |
|---|---|
| Responsible for | Led, Managed, Directed, Oversaw, Owned |
| Helped / Assisted with | Collaborated, Partnered, Supported, Contributed |
| Worked on | Developed, Executed, Delivered, Built, Completed |
| Handled | Processed, Administered, Resolved, Addressed |
| Made / Created | Designed, Produced, Engineered, Launched |
| Changed / Improved | Transformed, Streamlined, Revamped, Optimized |
| Did / In charge of | Executed, Spearheaded, Headed |
| Team player, hard-working, results-driven, detail-oriented, go-getter, self-starter, synergy, dynamic, passionate | **Delete and prove instead** with a concrete example/metric |

- **Rule for soft-skill claims:** NEVER assert a soft skill as an adjective; SHOW it via an achievement (instead of "team player," describe a cross-functional collaboration with an outcome).

---

## 6. Length, Typography & Formatting

- **Margins:** 1 inch (2.54cm) standard on all sides; 0.5 inch minimum acceptable to fit content. Below 0.5 inch looks cramped.
- **Fonts:** Use ATS-safe, screen-readable system fonts. **Sans-serif (Calibri, Arial, Helvetica, Aptos, Verdana)** for most modern roles; **serif (Cambria, Georgia, Garamond, Times New Roman)** acceptable for law/academia/finance/government.
- **Font size:** Body 10–12pt (11pt ideal); section headings 14–16pt; name 18–24pt. Never below 10pt.
- **Line spacing:** 1.0–1.15 within sections; slightly more (1.5) between sections.
- **Page size:** **Letter (8.5×11") for US/Canada; A4 (210×297mm) for UK/EU/most international.**
- **NEVER use:** Comic Sans, Papyrus, Brush Script, Courier, Impact, or any decorative/script font.
- **ALWAYS keep one font family throughout** (a header/body pairing of complementary fonts is acceptable).
- **ALWAYS maintain generous white space** — cluttered, dense pages performed worst in eye-tracking.

---

## 7. Tailoring

- **WHY generic fails:** Recruiters instantly spot mass-applied CVs (irrelevant skills, mismatched highlights, non-mirrored language); ATS ranks them low; ~22% of recruiters report rejecting for non-customization in surveys.
- **ALWAYS mirror the job description's language** (titles, skills, tools) where truthful — this raises both ATS match score and human relevance.
- **Title matching:** WHEN the candidate's real title differs from the posting but describes the same work, **use the posting's title if it is accurate** (or show both: "Customer Success Manager (Account Management)"). NEVER fabricate a title the candidate didn't hold.
- **Workflow the AI should follow:** (1) extract must-have keywords/skills from the posting; (2) map them to the candidate's genuine experience; (3) surface matches in summary, skills, and top bullets; (4) flag genuine gaps to the user rather than inventing.
- **At minimum, customize the top third** (summary, skills, first bullets) for every significant application.

---

## 8. Common Mistakes & Recruiter Red Flags

Survey data (Jobera 200-recruiter survey 2024; CareerBuilder; Resume Genius) consistently flags:
- **Typos/grammar errors** — top instant-disqualifier. In CareerBuilder's survey of 2,298 US hiring managers (Harris Interactive, conducted May–June 2012), "Resumes with typos – 61 percent" was the single highest-ranked reason to automatically dismiss a candidate; a separate CareerBuilder finding put the figure at "77 percent...instantly disqualify resumes with typos or bad grammar." Jobera (2024): 58% call typos a red flag and 85% have rejected for one.
- **Unexplained employment gaps** (~55% red flag).
- **Job-hopping** without explanation (~50–52% concern).
- **Vague job descriptions / duties without measurable achievements.**
- **Generic, untailored CVs.**
- **Inflated/inconsistent job titles** unsupported by substance.
- **Unprofessional email address** (~35–75% care).
- **Dishonesty / fabrication** — recruiters treat a caught lie as an automatic rejection; never embellish facts.
- **Irrelevant personal information / oversharing.**
- **Poor/cluttered formatting, obscure fonts.**

**Directives:**
- **ALWAYS proofread; flag any spelling/grammar issue to the user as critical.**
- **WHEN there is an employment gap, address it briefly and constructively** (e.g., "Career break, 2023–2024 — completed Google Data Analytics Certificate and supported a charity with reporting"). NEVER leave a long gap unexplained.
- **WHEN there is job-hopping, add brief context** (1–2 lines) or omit very short (<3-month) stints.

---

## 9. Modern Trends (2024–2026)

- **AI-written CV detection & backlash.** Recruiters now actively flag AI-generated content. Resume Genius (2025, 1,000 US hiring managers): 74% have seen AI-generated content in applications; 53% have reservations about AI content (20% call it a "critical issue"). Resume Now's "2025 AI and the Applicant Report" (survey of 925 US HR workers, March 28 2025): **"78% of hiring managers say personalized details signal genuine interest and fit. Meanwhile, 62% say AI-generated resumes without customization are more likely to be rejected."** An AI-generated résumé was cited as a top red flag (Resume Genius via CNBC, 2024).
  - **Directive: ALWAYS personalize.** Use AI to draft and structure, but inject specific, verifiable detail, real metrics, and the candidate's authentic voice. NEVER output generic boilerplate ("results-oriented professional with a proven track record…").
- **LinkedIn–CV consistency checks.** Recruiters cross-reference. **ALWAYS ensure dates, titles, employers match exactly** across CV and LinkedIn (LinkedIn may carry more detail, but the factual record must align). A photo is expected on LinkedIn (unlike the UK/US CV).
- **Skills-based hiring is mainstream.** LinkedIn Future of Recruiting 2025 (survey of 1,271 recruiting professionals across 23 countries, Sept 2024): 93% of talent professionals say accurately assessing skills is crucial; companies with the most skills-based searches are +12% more likely to make a quality hire. Degree requirements are loosening (26% of paid LinkedIn job posts didn't require a degree in 2023, up from 22% in 2020). **Directive: ALWAYS maintain a strong, searchable, accurate Skills section.**
- **Hybrid/remote presentation.** WHEN relevant, note remote/hybrid experience explicitly (e.g., "Led a distributed team of 8 across 4 time zones"; list async/collaboration tools). Specify location flexibility in the header or summary.

---

## 10. CAREER-CHANGER CVs & REFRAMING EXPERIENCE *(most important section)*

### 10.1 The core challenge & the evidence
Career-changers fail not because they lack ability but because **hiring systems screen for what you don't have (exact-match titles, credentials) rather than what you can do.** The Harvard Business School / Accenture report "Hidden Workers: Untapped Talent" (Sept 2021; survey of 8,720 "hidden workers" and 2,275 executives across the US, UK, and Germany) found: **"A large majority (88 per cent) of employers agree...that qualified high-skills candidates are vetted out of the process because they do not match the exact criteria established by the job description. That number rose to 94 per cent in the case of middle-skills workers."** Career-changers are squarely in this group. There is no rigorous audit study isolating career-changer callback rates vs. same-field candidates (a genuine evidence gap), but adjacent research (NBER resume-audit studies) shows callbacks fall with unemployment duration and "interim/unrelated" jobs, often due to automated screening.

The opportunity: **skills-based hiring dramatically expands career-changer eligibility.** LinkedIn's "Skills-First: Reimagining the Labor Market" report (2023) found that expanding the talent search to include workers with relevant skills "led on average to a 9.4x increase in eligible workers across all jobs" (and up to ~19x in the US specifically), and explicitly frames this as enabling hiring of "people who have never held that job title before or even worked in that industry before."

### 10.2 Format for career-changers
- **ALWAYS use the combination/hybrid format**, never pure functional.
  - Functional (skills-only, history hidden) is tempting but: (a) **recruiters distrust it** — they assume it hides gaps or weakness; (b) **ATS often can't parse it** (functional formats drop ~14–18 points behind chronological in parsing tests). A LinkedIn survey found recruiters spend less time on functional résumés; surveys cite ~72% of hiring managers prefer chronological/hybrid.
  - **Hybrid** solves both problems: it leads with a summary + skills/competencies block (the "pivoting" work, introducing target-field keywords) then provides a **full reverse-chronological work history** (the ATS-parseable, recruiter-trusted structure). Hybrid parses within 2–3 points of chronological in major ATS.
- **Hybrid structure for a career-changer:**
  1. Summary (3–4 sentences naming the target role + framing prior experience as foundation)
  2. Core Skills (grouped, leading with skills relevant to the new field)
  3. Relevant Projects / Certifications (bridge section showing transition investment)
  4. Work Experience (reverse-chronological; reframed bullets)
  5. Education

### 10.3 The career-change summary (controls the narrative)
This is the single most important section for a changer — it frames the pivot **before** the recruiter draws a negative conclusion from old job titles.
- **Formula:** [Current/past professional identity] + [years + transferable strengths] + [target role/field] + [value proposition / evidence of transition investment].
- **Position honestly:** WHEN the candidate hasn't earned the target title, do NOT fake it — use transferable context ("Administrator with three years' experience in education support, now targeting entry-level HR roles") rather than forcing an unearned label.
- **Example (teacher → corporate L&D):** "Educator with 7 years designing curriculum and facilitating learning for diverse audiences. Transitioning to corporate training to apply instructional-design expertise, presentation skills, and learner-engagement strategies to professional-development programs."

### 10.4 Headline/title when last title doesn't match
- **WHEN last job title ≠ target role:** use a target-aligned headline ("Aspiring UX Designer | Former Journalist") or a hybrid identity, and let the summary bridge. NEVER list a fabricated past title. Use the target field's vocabulary in the headline.

### 10.5 Transferable-skills translation (the heart of reframing)
- **Method:** (1) pull 3–6 target-role job descriptions; (2) extract their exact skill language; (3) map the candidate's genuine experience to that language; (4) **rename** the experience in the target field's vocabulary.
- **Recruiter principle (Senior TA Lead, paraphrased):** if your summary uses the hiring manager's industry language, you've already won half the battle.
- **ALWAYS strip jargon from the old field** (especially military/teaching/clinical) and translate to universally understood, target-industry terms.

**Industry translation examples table:**

| Old-field experience | Reframed for target field |
|---|---|
| Teacher: lesson planning | **Curriculum design / instructional design** (learning-design roles) |
| Teacher: parent evenings | **Stakeholder management / client communication** |
| Teacher: differentiated instruction | **User-centered / audience-segmented content design** |
| Teacher: train-the-trainer sessions; Bloom's Taxonomy | **L&D facilitation; learning frameworks** (cite by name as keywords) |
| Nurse: triage & patient prioritization | **Workflow analysis / operations under pressure** (healthtech, ops) |
| Nurse: EMR/EHR documentation | **Health-information systems / data compliance** (healthtech, CS) |
| Nurse: patient advocacy & empathy | **User research / customer empathy** (UX, customer success) |
| Military: infantry team leader | **Team manager / operations lead** (spell out, drop acronyms) |
| Military: combat medic | **Emergency Medical Technician (EMT) / healthcare specialist** |
| Military: logistics, inventory value, headcount | **Supply-chain/operations management** with quantified scope (# supervised, $ value managed) |
| Hospitality: front-office operations, scheduling | **Operations coordination / client service / logistics** |
| Journalist: research, writing, editing on deadline | **Content strategy / UX writing / corporate communications** |
| Journalist: interviewing sources | **User interviews / stakeholder research** (UX) |
| Retail/customer service: complaint resolution | **Customer success / conflict de-escalation / CRM management** |

### 10.6 De-emphasizing irrelevant experience without creating gaps
- **ALWAYS keep a complete chronological timeline** (no gaps) — but allocate space by relevance.
- **Use two experience tiers:** "**Relevant Experience**" (full bullets, reframed) and "**Additional Experience**" (condensed: title, company, dates, one line or none).
- **NEVER delete jobs to hide a pivot** (creates gaps that read as red flags). Condense instead.

### 10.7 Evidence of transition (projects, certs, volunteering, side work)
- **ALWAYS showcase proof the candidate has invested in the new field.** Tech recruiter guidance (Kerianne Burke, Segment): be specific about classes taken, independent research, projects. Many hiring managers value certifications near the level of a degree.
- Use a **Relevant Projects / Certifications** section: bootcamps, online certificates (Coursera, Google Career Certificates, LinkedIn Learning), freelance/side work, volunteer work in the target field. Bootcamps are a proven pivot vehicle — Course Report data: "79% of coding bootcamp grads are employed full-time and it takes 1–6 months to get that first job," and "the average bootcamper has 7 years of work experience, has at least a Bachelor's degree, and has never worked as a programmer." (The stricter, third-party-audited CIRR figure is ~71% in-field within 180 days — cite the self-reported 79% with that caveat, and avoid over-claiming.)
- **Example bullet:** "Completed Google Data Analytics Certificate while transitioning from retail management; applied learnings to a personal project analyzing sales trends across three quarters."

### 10.8 Cover letter interplay
- **Career-change cover letters are higher-value than for any other applicant type.** The résumé establishes *what* (transferable skills) and *how* (reframed achievements); the cover letter explains the *why* of the pivot to a human. Vendor survey data (GetCoverLetter, 2,000 recruiters): ~50% of hiring managers say explaining a career change is an important purpose of a cover letter; ~49% say the same for explaining gaps.
- **Directive: NEVER advise a career-changer to skip the cover letter, even when optional.** ALWAYS frame the change as intentional evolution, not a reset or desperation ("After 6 years in hospitality management, I'm pursuing HR — a natural extension of building teams, handling sensitive employee situations, and improving workplace culture").

### 10.9 How recruiters evaluate career-changers — reject vs. consider
**Rejects when:**
- Transferable skills are listed but **not connected** to specific target-role requirements.
- The CV reads as an **apology** for the past rather than an argument for fit.
- **No evidence of transition investment** (no courses/certs/projects).
- Old-field jargon dominates; recruiter can't "connect the dots."
- Pure functional format triggers "what are they hiding?"

**Considers when:**
- Summary uses the **target industry's language** and names the target role.
- Transferable skills are **explicitly mapped** to the new role's needs.
- There is **concrete proof of commitment** (certs, projects, volunteering).
- Quantified achievements show the candidate "can hit the ground running."
- Clean hybrid format with a transparent timeline.

### 10.10 Worked before/after examples

**Teacher → Learning Designer**
- Before: "Responsible for teaching Year 9 English and planning lessons."
- After: "Designed and delivered differentiated curriculum for 120+ learners across mixed-ability groups, applying Bloom's Taxonomy and backward-design principles — directly transferable to instructional-design and L&D content development."

**Nurse → Customer Success (healthtech)**
- Before: "Provided patient care and used hospital EMR system."
- After: "Trained 15+ clinical staff on EMR workflows and resolved system-adoption issues, reducing documentation errors — combining healthcare domain expertise with software-adoption and client-enablement skills for health-tech customer success."

**Journalist → UX/Content Designer**
- Before: "Wrote and edited news articles on deadline."
- After: "Researched user needs through 50+ source interviews and translated complex information into clear, audience-tested content under tight deadlines — applying research, information architecture, and concise writing skills to UX content design."

**Military → Civilian Operations**
- Before: "Served as infantry squad leader responsible for platoon."
- After: "Led and developed a 12-person team in high-pressure environments, managing $2M+ in equipment and coordinating cross-functional logistics — translating directly to operations and team-management roles." (NEVER leave acronyms like BNCOC, MOS; translate or expand.)

---

## 11. Quick Pre-Flight Checklist (AI should verify before finalizing)

1. Single-column, standard headings, ATS-safe font, no tables/text-boxes/headers-footers/graphics?
2. Contact info in the body; LinkedIn URL visible and consistent with CV?
3. Region-correct: term (CV/résumé), length, photo policy, personal-details policy, spelling, page size?
4. Top third carries target title + strongest achievement?
5. Every bullet = action verb + scope + quantified/qualified outcome; no "responsible for"/clichés?
6. Keywords mirror the specific job description; surfaced in Skills + bullets; acronyms spelled out?
7. Tailored summary (region-appropriate length); objective only if entry-level/changer?
8. No typos, no unexplained gaps, no unexplained job-hopping, no fabrication?
9. Career-changer: hybrid format, pivot summary, translated skills, transition evidence, cover letter recommended?
10. Personalized and human — not generic AI boilerplate?

---

## 12. Source-Confidence Notes (for maintainers)

- **Cite confidently (Tier 1):** Ladders 2018 Eye-Tracking Study (7.4s); HBS/Accenture "Hidden Workers" 2021 (88%/94% ATS filtering); LinkedIn "Skills-First" 2023 (9.4x global / ~19x US talent-pool expansion); LinkedIn "Future of Recruiting" 2025 (93% skills assessment, +12% quality of hire); Course Report / CIRR bootcamp outcomes (79% self-reported vs ~71% audited); National Careers Service & Prospects (UK conventions); Nielsen Norman Group (F-pattern, UX career-changer guidance).
- **Cite with vendor attribution + year (Tier 2):** Resume Now, Resume Genius, Jobera, GetCoverLetter, CareerBuilder survey figures — self-reported recruiter polls, directional not definitive.
- **Do not state as fact:** the "average person changes careers 5–7 times" claim (no verifiable primary source; BLS only supports ~12.9 *jobs* per lifetime and explicitly does not track "career changes"); any "X% of recruiters" stat lacking a named survey.
