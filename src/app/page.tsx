import Link from 'next/link'
import BecomeSection from './_components/BecomeSection'
import SalaryBridgeSection from './_components/SalaryBridgeSection'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '80px 24px 64px', textAlign: 'center' }}>
        <span style={{ background: '#EBF5F3', color: '#3D8A7A', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: 0.3 }}>
          Free to use · No CV judgement
        </span>
        <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 'clamp(36px,5vw,58px)', lineHeight: 1.2, marginTop: 24, marginBottom: 20, color: '#2D2926' }}>
          Discover what you're capable of becoming —{' '}
          <em style={{ color: '#E07A5F' }}>not just what you've already done.</em>
        </h1>
        <p style={{ fontSize: 18, color: '#7A756F', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
          Upload your CV, answer a few questions, and receive an AI-generated capability profile with career pathways and transition steps.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" style={{ padding: '15px 32px', background: '#E07A5F', color: '#FFF', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
            ↗ Create my profile
          </Link>
          <Link href="/auth" style={{ padding: '15px 32px', background: 'transparent', color: '#2D2926', border: '1.5px solid #E8E3DA', borderRadius: 12, fontSize: 16, fontWeight: 500, textDecoration: 'none' }}>
            See how it works
          </Link>
        </div>
        <p style={{ fontSize: 13, color: '#7A756F', marginTop: 20 }}>No credit card · No recruitment · No judgement</p>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#FFF', borderTop: '1px solid #E8E3DA', borderBottom: '1px solid #E8E3DA', padding: '32px 24px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, textAlign: 'center' }}>
          {[
            ['84%', 'of users said it understood them better than their CV'],
            ['3–5', 'personalised career pathways generated per profile'],
            ['100%', 'user-controlled — delete your data anytime'],
          ].map(([n, l]) => (
            <div key={n}>
              <div style={{ fontFamily: 'var(--font-lora)', fontSize: 36, color: '#E07A5F', marginBottom: 6 }}>{n}</div>
              <div style={{ fontSize: 13, color: '#7A756F', lineHeight: 1.5 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 32, textAlign: 'center', marginBottom: 8 }}>How it works</h2>
        <p style={{ textAlign: 'center', color: '#7A756F', marginBottom: 48 }}>Four steps. Under 20 minutes. No recruitment process.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20 }}>
          {[
            ['01', 'Upload your CV', 'PDF, Word, or paste text — we extract what matters.'],
            ['02', 'Answer questions', 'Interests, hobbies, energy, goals — the stuff CVs miss.'],
            ['03', 'AI builds your profile', 'Capabilities, hidden strengths, and what you could become.'],
            ['04', 'Explore your future', 'Pathways, roadmaps, salary reality, and mentor validation.'],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: '#FFF', border: '1px solid #E8E3DA', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E07A5F', marginBottom: 12, letterSpacing: 1 }}>{n}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{t}</div>
              <div style={{ fontSize: 14, color: '#7A756F', lineHeight: 1.6 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why CVs fail */}
      <div style={{ background: '#FFF', borderTop: '1px solid #E8E3DA', borderBottom: '1px solid #E8E3DA', padding: '64px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 30, marginBottom: 16 }}>
            CVs show what you've done.<br /><em style={{ color: '#E07A5F' }}>Not what you could become.</em>
          </h2>
          <p style={{ color: '#7A756F', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
            A teacher's CV looks like a teacher's CV. Traditional recruitment systems sort people into existing job titles — they can't see the project manager inside the classroom, or the consultant hiding in years of unpaid expertise.
          </p>
          <p style={{ color: '#7A756F', lineHeight: 1.8, fontSize: 15 }}>
            Capability Navigator reads what your CV can't say for itself.
          </p>
        </div>
      </div>

      {/* Dark sections — Become + Salary Bridge */}
      <BecomeSection />
      <SalaryBridgeSection />

      {/* Privacy & final CTA */}
      <div style={{ background: '#FDF0EA', borderTop: '1px solid #E8E3DA', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h3 style={{ fontFamily: 'var(--font-lora)', fontSize: 26, marginBottom: 12 }}>Privacy and trust</h3>
          <p style={{ color: '#7A756F', lineHeight: 1.8, marginBottom: 28 }}>
            We don't sell your data. We don't collect protected characteristics. You control your profile and can delete everything at any time. AI output is guidance — not a judgement of your worth.
          </p>
          <Link href="/auth" style={{ display: 'inline-block', padding: '15px 32px', background: '#E07A5F', color: '#FFF', borderRadius: 12, fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
            Create my profile — it's free
          </Link>
        </div>
      </div>
    </div>
  )
}
