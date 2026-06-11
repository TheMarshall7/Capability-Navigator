import type { PublicTransition } from '@/lib/transitions'

/** Rich landing-page transformation cards (BecomeSection carousel). */
export const LANDING_TRANSFORMATIONS = [
  {
    from: 'Secondary Teacher', to: 'Learning Designer', field: 'Tech & L&D',
    overlap: 84, salary: '+£12k', time: '4 months',
    quote: 'I had been designing learning experiences for years. I just didn\'t know that was a job.',
    name: 'Sarah M.', tags: ['Curriculum design', 'Instructional sequencing', 'Content creation'],
    accent: '#E07A5F',
  },
  {
    from: 'Nurse', to: 'Customer Success Manager', field: 'SaaS / HealthTech',
    overlap: 76, salary: '+£18k', time: '6 months',
    quote: 'I spent six years managing the most difficult conversations imaginable. That\'s exactly what CS is.',
    name: 'Daniel O.', tags: ['Patient advocacy', 'Crisis communication', 'Stakeholder management'],
    accent: '#3D8A7A',
  },
  {
    from: 'Journalist', to: 'Product Manager', field: 'Digital Media / Tech',
    overlap: 68, salary: '+£22k', time: '8 months',
    quote: 'Pitching stories, reading audiences, finding the angle nobody else sees — that\'s product thinking.',
    name: 'Amara K.', tags: ['User research', 'Narrative framing', 'Deadline management'],
    accent: '#7C6AF0',
  },
  {
    from: 'Events Coordinator', to: 'Operations Manager', field: 'Startup / Scale-up',
    overlap: 81, salary: '+£9k', time: '3 months',
    quote: 'Running a wedding for 200 people under a venue crisis is harder than any ops role I\'ve had since.',
    name: 'Priya T.', tags: ['Logistics under pressure', 'Vendor management', 'Stakeholder comms'],
    accent: '#E8A838',
  },
] as const

function parseTimeMonths(time: string): number | null {
  const m = time.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

/** Example transitions mapped to PublicTransition shape for /transitions empty state. */
export const EXAMPLE_TRANSITIONS: PublicTransition[] = LANDING_TRANSFORMATIONS.map(t => ({
  original_role: t.from,
  new_role: t.to,
  time_taken_months: parseTimeMonths(t.time),
  salary_change: t.salary.startsWith('+') ? 'increased' : t.salary.startsWith('-') ? 'decreased' : 'same',
  what_worked: t.quote,
  headline: null,
  created_at: new Date().toISOString(),
  isExample: true,
}))
