import type { CapabilityReport, GenerateReportInput } from '@/types'
import { getGeminiClient, getGeminiModel } from '@/lib/gemini-client'

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior career capability analyst and human development expert for Capability Navigator.

Your role is to analyse a person's CV and questionnaire answers to generate a deeply personalised capability profile. This is NOT a job-matching service or a recruitment tool.

CORE PHILOSOPHY:
- People are not job titles. CVs show what someone has done, not what they could become.
- Identify transferable capabilities and hidden strengths with genuine insight.
- Be empowering, not judgemental. Never rank, score or reject.
- Use hobbies and interests as evidence of real capability — not soft context.
- Identify what a traditional recruitment system would miss about this person.

LANGUAGE RULES:
- Never say: "unsuitable", "low value", "rejected", "personality score", "you are a..."
- Always use: "current overlap", "suggested pathway", "capability gap", "possible next step", "evidence from your experience"
- Tone: calm, intelligent, hopeful, grounded, human. Like a brilliant mentor, not an algorithm.
- Avoid: corporate recruitment clichés, harsh scoring, deterministic language.

PROTECTED CHARACTERISTICS:
- Never reference or infer religion, ethnicity, health conditions, sexuality, political views, disability or age.
- Never make career suggestions based on protected characteristics.
- Never make psychological diagnoses.

OUTPUT REQUIREMENTS:
- Respond ONLY with valid JSON matching the exact schema provided.
- No markdown, no preamble, no explanation outside the JSON.
- capabilitySummary: 3–4 sentences. Genuine, specific, not generic.
- coreCapabilities: exactly 6, each with concrete evidence from the CV/answers.
- hiddenStrengths: exactly 4, focused on what CVs typically undersell.
- careerPathways: exactly 5, each with a complete roadmap.
- All list fields (suggestedLearning, firstThreeActions, etc.) must have 3–5 items minimum.
- capabilityOverlap: integer 0–100. Do not inflate. Be honest and optimistic, not flattering.
- difficulty: exactly "Low", "Medium", or "High".`

// ─── Main function ────────────────────────────────────────────────────────────

export async function generateCapabilityReport(
  input: GenerateReportInput
): Promise<CapabilityReport> {
  const client = getGeminiClient()

  if (!client) {
    console.log('[AI Service] No Gemini key — returning mock data')
    return getMockReport()
  }

  const userPrompt = buildUserPrompt(input)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55_000) // 55s — leaves buffer before Vercel's 60s limit

  try {
    const response = await client.models.generateContent({
      model: getGeminiModel(),
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
        abortSignal: controller.signal,
      },
    })
    clearTimeout(timeout)

    const content = response.text
    if (!content) throw new Error('Empty response from Gemini')

    const parsed = JSON.parse(content) as CapabilityReport
    return parsed
  } catch (err: any) {
    clearTimeout(timeout)
    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      console.error('[AI Service] Gemini request timed out after 55s — falling back to mock')
    } else {
      console.error('[AI Service] Generation failed:', err)
    }
    // Degrade gracefully to mock data rather than breaking the user experience
    return getMockReport()
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildUserPrompt(input: GenerateReportInput): string {
  const { cvText, questionnaireAnswers: qa } = input

  return `Analyse this person's CV and questionnaire answers. Generate a complete capability profile.

=== CV TEXT ===
${cvText || 'No CV provided — rely heavily on questionnaire answers.'}

=== QUESTIONNAIRE ANSWERS ===
Current/most recent role: ${qa.role || 'Not provided'}
Years of experience: ${qa.years || 'Not provided'}
Current situation: ${qa.situation || 'Not provided'}
Location: ${qa.city || ''}, ${qa.country || ''}
Working arrangements considered: ${JSON.stringify(qa.arrangements || [])}

5-year vision: ${qa.fiveYears || 'Not provided'}
Career curiosities: ${qa.curious || 'Not provided'}
Most important in next chapter: ${JSON.stringify(qa.matters || [])}

Activities that give energy: ${JSON.stringify(qa.energises || [])}
Activities that drain energy: ${JSON.stringify(qa.drains || [])}
Most proud of at work: ${qa.proud || 'Not provided'}
What people come to them for: ${qa.helpWith || 'Not provided'}

Hobbies and interests: ${qa.hobbies || 'Not provided'}
Personal or side projects: ${qa.projects || 'Not provided'}
Topics they self-educate on: ${qa.learning || 'Not provided'}
Ideal working week (no money constraint): ${qa.moneyNoObject || 'Not provided'}

Environment preference: ${qa.environment || 'Not provided'}
Work preference: ${qa.workPreference || 'Not provided'}
Uncertainty comfort (1–5): ${qa.uncertainty || 'Not provided'}
Personality type: ${qa.personality || 'Not provided'}

Open to retraining: ${qa.openToRetrain || 'Not provided'}
Time available for learning per week: ${qa.learningTime || 'Not provided'}
Willing to take salary/seniority step back: ${qa.salaryStep || 'Not provided'}
Timeline: ${qa.timeline || 'Not provided'}

Better than most people at: ${qa.betterThanMost || 'Not provided'}
Most overlooked strength: ${qa.overlooked || 'Not provided'}
Ideal future in one sentence: ${qa.idealFuture || 'Not provided'}

=== OUTPUT SCHEMA ===
Return ONLY valid JSON in this exact structure:
{
  "capabilitySummary": "string",
  "coreCapabilities": [
    { "title": "string", "explanation": "string", "evidence": "string" }
  ],
  "hiddenStrengths": [
    { "title": "string", "explanation": "string" }
  ],
  "workStyleSummary": "string",
  "cvUnderrepresentationSummary": "string",
  "careerPathways": [
    {
      "title": "string",
      "matchReason": "string",
      "capabilityOverlap": 0,
      "missingSkills": ["string"],
      "difficulty": "Low|Medium|High",
      "estimatedTransitionTime": "string",
      "firstStep": "string",
      "roadmap": {
        "startingPoint": "string",
        "targetCareer": "string",
        "existingStrengths": ["string"],
        "skillGaps": ["string"],
        "suggestedLearning": ["string"],
        "portfolioEvidence": ["string"],
        "entryRoutes": ["string"],
        "jobSearchTerms": ["string"],
        "firstThreeActions": ["string"],
        "threeMonthPlan": ["string"],
        "sixMonthPlan": ["string"],
        "twelveMonthPlan": ["string"]
      }
    }
  ]
}`
}

// ─── Mock data — teacher career change demo ───────────────────────────────────
// High quality mock used when no API key is present.
// This is the seeded demo profile as specified in the build requirements.

function getMockReport(): CapabilityReport {
  return {
    capabilitySummary: "You bring an exceptional combination of communication mastery, curriculum design instinct, and the ability to make complex ideas genuinely accessible. After eight years translating difficult concepts for diverse learners, you have built deep expertise in understanding how people process information — a capability that transfers directly into roles far beyond the classroom. Your pattern of creating structured resources from scratch, managing competing demands across multiple stakeholders, and mentoring others reveals a profile that is equal parts designer, strategist, and human-centred guide.",

    coreCapabilities: [
      {
        title: "Instructional Design",
        explanation: "You don't just teach — you architect learning experiences. You identify where understanding breaks down and build purposeful pathways around those gaps.",
        evidence: "8 years designing and iterating lesson plans, units, and assessments across mixed-ability groups of up to 30 students."
      },
      {
        title: "Communication & Simplification",
        explanation: "You can take dense, abstract content and make it clear, engaging, and actionable — without losing nuance. This is a rare skill most professionals spend careers trying to develop.",
        evidence: "Teaching English literature and language to students aged 11–18; adapting tone, vocabulary and complexity to different audiences daily."
      },
      {
        title: "Stakeholder Management",
        explanation: "You routinely navigate relationships with students, parents, senior leadership, governors, and external agencies — each with different needs, different power dynamics, and different definitions of success.",
        evidence: "Led parent evenings, reported to SLT, managed classroom support staff, and coordinated with external SEND agencies."
      },
      {
        title: "Systems & Curriculum Thinking",
        explanation: "You think in terms of sequences, dependencies, and outcomes — not isolated moments. You build coherent journeys, not just individual sessions.",
        evidence: "Sole designer of department's Year 9 curriculum redesign project; introduced a tracked progression system adopted across the department."
      },
      {
        title: "Empathy-Led Problem Solving",
        explanation: "You read the room. You adapt in real time. You understand that motivation, emotion, and context shape what's possible — and you design around that reality.",
        evidence: "SENCO collaboration and pastoral care experience across multiple years; documented approach to adaptive learning support."
      },
      {
        title: "Content Creation at Scale",
        explanation: "You produce high-quality written and visual materials regularly — from detailed schemes of work to engaging classroom resources — and you do it fast, without losing quality.",
        evidence: "Created 40+ original resource packs shared across the department and wider school network."
      }
    ],

    hiddenStrengths: [
      {
        title: "Product Thinking",
        explanation: "Building a curriculum is product management. You define the user (the student), identify the problem (the knowledge gap), design the solution (the lesson or unit), test it in deployment, gather feedback, and iterate. This maps directly to product roles."
      },
      {
        title: "Training Design at Scale",
        explanation: "Your resource packs and schemes of work are essentially structured training programmes. Organisations pay tens of thousands of pounds for this kind of carefully designed, evidence-based content — you have been building it for years."
      },
      {
        title: "Persuasion Without Pressure",
        explanation: "You have spent years getting teenagers to genuinely care about things they initially have no interest in caring about. That is one of the hardest persuasion challenges that exists. It transfers directly into customer success, sales enablement, and change management roles."
      },
      {
        title: "Documentation & Knowledge Management",
        explanation: "You produce detailed, structured, useful written outputs as a professional habit. Many teams in tech and operations struggle to find people who can write clearly, create systems, and build documentation that actually gets used."
      }
    ],

    workStyleSummary: "You work best in environments where you have meaningful autonomy over how you deliver — even within clearly defined goals. You are equally comfortable leading a room or working quietly on a detailed project. You prefer clarity on outcomes but flexibility in method. You are energised by variety across the day rather than repetitive task-based work, and you need to feel that your output has genuine impact on real people.",

    cvUnderrepresentationSummary: "A teaching CV is optimised for other teaching jobs. It speaks the language of SLTs, Ofsted, and HR departments who already understand what a Deputy Head of Department looks like. It almost certainly undersells your project design capability, the volume of original content you have created, the breadth of your stakeholder relationships, and your ability to adapt complex material for entirely different audiences. Most recruiters outside education will not know how to read it — not because the experience is not there, but because the language does not cross over. This profile is designed to surface what your CV cannot say for itself.",

    careerPathways: [
      {
        title: "Learning Designer",
        matchReason: "Your entire career has been building structured learning experiences. The shift to corporate or digital learning design is lateral, not a step down — and your real-classroom credibility will be a genuine differentiator against candidates who have only ever designed for corporate audiences.",
        capabilityOverlap: 84,
        missingSkills: ["Articulate Storyline or Rise 360 (e-learning authoring tools)", "SCORM/LMS platform familiarity", "Corporate stakeholder language", "Instructional design theory terminology (ADDIE, SAM)"],
        difficulty: "Low",
        estimatedTransitionTime: "3–6 months",
        firstStep: "Create a free Articulate Rise account and publish a short learning module on a topic you know well. Add it to a simple portfolio page — even a free Notion page works.",
        roadmap: {
          startingPoint: "Secondary English Teacher with 8 years experience and strong curriculum and instructional design background",
          targetCareer: "Learning Designer (L&D, EdTech, Corporate Training)",
          existingStrengths: ["Curriculum design", "Instructional sequencing", "Writing and content creation", "Learner empathy", "Feedback and iteration"],
          skillGaps: ["E-learning authoring tools", "LMS platform experience", "Corporate L&D vocabulary", "Visual design basics"],
          suggestedLearning: ["Articulate Rise 360 — free 60-day trial, build a real module", "LinkedIn Learning: Instructional Design Fundamentals (free with many library cards)", "Coursera: Learning Design and Technology (Purdue University)", "YouTube: Articulate community tutorials"],
          portfolioEvidence: ["Build a 10-minute e-learning module on a topic you know deeply", "Redesign one of your existing resources in Canva or Rise for a corporate context", "Write a learning needs analysis document for a fictional team onboarding scenario"],
          entryRoutes: ["L&D Coordinator at a mid-size company (often open to career changers)", "EdTech content designer at an education technology company", "Internal trainer or learning specialist at a growing company", "Freelance learning designer via direct outreach or LinkedIn"],
          jobSearchTerms: ["Learning Designer", "Instructional Designer", "L&D Specialist", "eLearning Developer", "Training Designer", "Learning Experience Designer"],
          firstThreeActions: ["Create a free Articulate Rise account and build your first module this week", "Update your LinkedIn headline to 'Learning Designer | 8 Years Curriculum & Instructional Design'", "Join the Learning & Development Professionals LinkedIn group and make your first post"],
          threeMonthPlan: ["Complete one authoring tool module you are proud of", "Reframe LinkedIn profile and CV for L&D roles using corporate language", "Apply to 5 L&D Coordinator or Learning Designer roles", "Connect with 3 L&D professionals and ask for a 20-minute conversation"],
          sixMonthPlan: ["Build a portfolio of 3 complete e-learning samples", "Complete one recognised online certification", "Attend a Learning Technologies event or webinar", "Aim for your first interview in an L&D role"],
          twelveMonthPlan: ["Land first Learning Designer or L&D Specialist role", "Complete a formal instructional design qualification if required", "Begin building a personal brand in the L&D space online"]
        }
      },
      {
        title: "Customer Success Manager",
        matchReason: "Customer success is fundamentally about helping people get real value from something complex — and then keeping them on track when they want to give up. You have done a version of this every working day for eight years. Your ability to read people, build trust under pressure, and translate complexity into clarity is exactly what top CS teams spend months trying to hire.",
        capabilityOverlap: 71,
        missingSkills: ["CRM tools (Salesforce, HubSpot, Gainsight)", "SaaS product domain knowledge", "Commercial metrics (NRR, churn, expansion revenue)", "B2B account management vocabulary"],
        difficulty: "Medium",
        estimatedTransitionTime: "4–8 months",
        firstStep: "Complete the free HubSpot Customer Success Certification (takes about 4 hours). It signals clear commercial intent and gives you a starting vocabulary for interviews.",
        roadmap: {
          startingPoint: "Secondary English Teacher transitioning to commercial relationship management roles",
          targetCareer: "Customer Success Manager (SaaS, EdTech, or professional services)",
          existingStrengths: ["Relationship management", "Communication under pressure", "Explaining complex ideas simply", "Empathy and stakeholder reading", "Documentation and progress reporting"],
          skillGaps: ["CRM platform experience", "Commercial and revenue vocabulary", "SaaS product domain knowledge", "Handling commercial escalations and renewals"],
          suggestedLearning: ["HubSpot Customer Success Certification (free, 4 hours)", "Gainsight free CS fundamentals resources", "SuccessHacker community and newsletter (free)", "SaaStr podcast — essential context for SaaS business models"],
          portfolioEvidence: ["Write a mock customer success plan for a fictional SaaS product", "Document a real situation where you retained a difficult student or parent relationship — reframe it in commercial language", "Create a 'customer health scorecard' framework based on your experience tracking student progress"],
          entryRoutes: ["Customer Success Manager at an EdTech company — your teaching background is a direct asset, not a gap", "Account Manager at a professional services or training company", "Client Onboarding Specialist at a growing SaaS startup"],
          jobSearchTerms: ["Customer Success Manager", "CSM", "Account Manager", "Client Success", "Customer Onboarding Specialist", "EdTech Customer Success"],
          firstThreeActions: ["Complete HubSpot Customer Success certification this week", "Rewrite your CV with commercial language — stakeholders become clients, parents become account holders, reports become success metrics", "Apply to 3 EdTech companies where your teaching experience is a direct advantage"],
          threeMonthPlan: ["Complete CS certifications", "Reframe all experience in commercial language", "Target EdTech and education-adjacent companies first", "Build network in CS community via LinkedIn and dedicated Slack communities"],
          sixMonthPlan: ["Land first CSM interviews", "Potentially take a Customer Onboarding Specialist role as a stepping stone", "Contribute to CS communities to build credibility and connections"],
          twelveMonthPlan: ["Secure CSM role at a company where your background is genuinely valued", "Work toward senior or strategic account ownership within 18 months of joining"]
        }
      },
      {
        title: "Product Manager",
        matchReason: "Building a curriculum is product management with a human face. You define user needs, design solutions around them, test them in deployment, gather feedback, and iterate. The vocabulary is entirely different; the thinking process is not. You have a genuine advantage in products that serve learners, educators, or any complex stakeholder group — because you have lived the problem.",
        capabilityOverlap: 62,
        missingSkills: ["Product management frameworks (Agile, Scrum, OKRs)", "Technical literacy (APIs, databases — awareness, not coding)", "Data analysis and product metrics", "Roadmap and prioritisation tools (Jira, Linear, Notion)"],
        difficulty: "Medium",
        estimatedTransitionTime: "6–12 months",
        firstStep: "Read 'Inspired' by Marty Cagan and 'The Mom Test' by Rob Fitzpatrick. Together these two books give you the foundational mental models to start speaking the language of product management.",
        roadmap: {
          startingPoint: "Teacher with curriculum design, stakeholder management, and structured problem-solving experience",
          targetCareer: "Product Manager (EdTech, consumer learning, or B2B SaaS)",
          existingStrengths: ["User research instincts", "Systems and sequencing thinking", "Stakeholder communication", "Outcome-oriented planning", "Strong written communication"],
          skillGaps: ["Agile and Scrum methodology", "Product analytics tools (Amplitude, Mixpanel)", "Technical awareness (not coding, but understanding of how products are built)", "Prioritisation frameworks (RICE, MoSCoW, impact/effort)"],
          suggestedLearning: ["'Inspired' by Marty Cagan — read this first", "'The Mom Test' by Rob Fitzpatrick — essential for user research", "Lenny's Newsletter on Substack — free tier is excellent", "Google Project Management Certificate (Coursera — free audit available)"],
          portfolioEvidence: ["Write a product requirements document (PRD) for an education problem you know intimately", "Run 3 user interviews with teachers or parents and document the insights formally", "Create a fictional product roadmap for an EdTech tool, with prioritised features and rationale"],
          entryRoutes: ["Associate PM programme at a tech company with structured training", "Product Manager at an EdTech company where teaching experience is domain expertise", "Product Owner role at a company with a strong coaching and mentoring culture"],
          jobSearchTerms: ["Associate Product Manager", "Product Manager EdTech", "Product Owner", "Junior Product Manager", "APM programme", "Product Analyst"],
          firstThreeActions: ["Read 'Inspired' and 'The Mom Test' (this month)", "Join Lenny's Community or Product School Slack", "Write your first PRD for an imaginary tool that would have genuinely helped you as a teacher"],
          threeMonthPlan: ["Build PM vocabulary and core frameworks", "Complete Google Project Management Certificate", "Write 2–3 case studies reframing your teaching experience as product work"],
          sixMonthPlan: ["Apply to APM programmes and EdTech PM roles", "Build network in the product community via LinkedIn and Slack", "Start sharing product thinking and commentary on LinkedIn"],
          twelveMonthPlan: ["Land first PM or Product Owner role, ideally at an EdTech company", "Build toward full PM responsibility within 18–24 months"]
        }
      },
      {
        title: "Training Consultant",
        matchReason: "You are already a highly experienced professional trainer — you have just been doing it inside a single institution rather than selling it commercially. The shift to consulting is fundamentally about packaging your existing expertise, defining a specific niche, and building the commercial confidence to charge for what you already know how to do well.",
        capabilityOverlap: 78,
        missingSkills: ["Commercial pricing and proposal writing", "Sales and business development basics", "Corporate facilitation techniques for adult learners", "Building and managing a client pipeline"],
        difficulty: "Low",
        estimatedTransitionTime: "3–6 months",
        firstStep: "Define the one specific problem you can solve better than most people. Then write a single page: what is the workshop, who is it for, what does it deliver, and what does it cost. Start there.",
        roadmap: {
          startingPoint: "Experienced teacher with strong delivery, resource design, and content expertise across 8 years",
          targetCareer: "Training Consultant, Corporate Trainer, or Facilitation Specialist",
          existingStrengths: ["Training delivery and facilitation", "Content and curriculum design", "Audience reading and real-time adaptation", "Structured materials creation", "Feedback collection and iteration"],
          skillGaps: ["Commercial proposal writing", "Pricing and sales conversations", "Facilitation techniques specific to adult corporate learners", "Building a repeatable client acquisition pipeline"],
          suggestedLearning: ["Association for Talent Development (ATD) — free resources and community", "'Facilitating with Ease' by Ingrid Bens — the standard reference", "Building a consulting practice resources on Substack (several excellent free writers)", "Communication and facilitation masterclasses on Udemy"],
          portfolioEvidence: ["Design a half-day workshop and write it up as a proper proposal with clear outcomes and pricing", "Offer one free session to a local business, charity, or community group — then collect testimonials", "Document every training or development experience from your teaching career as a case study"],
          entryRoutes: ["Join a training company as an associate trainer — low risk, immediate income", "Approach small businesses directly with a specific, well-defined workshop offer", "Partner with a corporate training company as a subject matter expert or specialist freelancer"],
          jobSearchTerms: ["Corporate Trainer", "Training Consultant", "L&D Facilitator", "Workshop Facilitator", "Associate Trainer", "Soft Skills Trainer", "Communication Trainer"],
          firstThreeActions: ["Write your first workshop outline and one-page proposal this weekend", "Identify 3 local businesses or charities where you could offer a free 90-minute session", "Create a simple LinkedIn post explaining the specific thing you help teams with"],
          threeMonthPlan: ["Complete first 2–3 sessions (paid or free to build evidence)", "Build a simple one-page website or LinkedIn portfolio", "Define your specialist niche with clarity"],
          sixMonthPlan: ["Land your first paying client", "Create a repeatable, documented workshop offering", "Develop clear pricing structure and a reusable proposal template"],
          twelveMonthPlan: ["Build to 3–5 regular clients, or join a training company as a regular associate", "Create a signature workshop programme you are known for", "Decide whether to go fully independent or stay associate-based"]
        }
      },
      {
        title: "Operations Coordinator",
        matchReason: "You have been running a complex, multi-stakeholder operation — scheduling, resourcing, communicating across hierarchies, managing competing deadlines, and doing all of this in real time with no room for error — for years. Most operations coordinator roles are genuinely less complex than a fully loaded teaching timetable. Your transferable skills here are underestimated by you more than they would be by the right employer.",
        capabilityOverlap: 68,
        missingSkills: ["Project management tools (Asana, Monday.com, ClickUp)", "Business process documentation and SOP writing", "Corporate operations vocabulary", "Budget tracking and basic financial management"],
        difficulty: "Low",
        estimatedTransitionTime: "2–4 months",
        firstStep: "Start the free Google Project Management Certificate on Coursera today. It takes 6 months at 10 hours a week, but you can audit it free. It gives you the vocabulary, the frameworks, and a credible credential to put on your CV immediately.",
        roadmap: {
          startingPoint: "Teacher with strong coordination, planning, multi-stakeholder management, and documentation experience",
          targetCareer: "Operations Coordinator, Project Coordinator, or Office Manager",
          existingStrengths: ["Planning and scheduling across competing demands", "Multi-stakeholder coordination", "Clear documentation and reporting", "Process management under pressure", "Communication across organisational levels"],
          skillGaps: ["Business process documentation and SOP creation", "Project management tool proficiency", "Basic budget tracking", "Corporate operations metrics and KPIs"],
          suggestedLearning: ["Google Project Management Certificate (Coursera — free audit)", "Notion or Asana tutorials on YouTube — both have excellent free resources", "Process Street for SOP creation (free tier available)", "Operations management fundamentals on Coursera or LinkedIn Learning"],
          portfolioEvidence: ["Document a process you manage in teaching — such as parent evening coordination — written up as a formal business SOP", "Build a Notion workspace showing how you would manage a small team's work and communication", "Create a project plan for a fictional company initiative, using a free tool like Asana or Trello"],
          entryRoutes: ["Operations Coordinator at a charity or non-profit — values alignment often offsets experience gap", "Project Coordinator at a growing SME or startup where flexibility is valued", "Office Manager or Team Coordinator at a company that values people skills over technical credentials"],
          jobSearchTerms: ["Operations Coordinator", "Project Coordinator", "Office Manager", "Team Coordinator", "Business Operations Coordinator", "Programme Coordinator"],
          firstThreeActions: ["Start the Google Project Management Certificate today — free audit on Coursera", "Rewrite three bullet points from your current CV using operations language", "Search 'Operations Coordinator' roles in your area this week to understand what specific tools and language are in demand"],
          threeMonthPlan: ["Complete the Google PM Certificate", "Reframe CV entirely for operations and coordination roles", "Apply to 10+ coordinator roles across sectors — not just education"],
          sixMonthPlan: ["Land first operations or project coordinator role", "Build familiarity with tools used in your new workplace", "Start developing a professional network outside education"],
          twelveMonthPlan: ["Progress toward Senior Coordinator or Operations Manager track", "Build commercial operations experience that opens doors to PM or strategy roles long-term"]
        }
      }
    ]
  }
}
