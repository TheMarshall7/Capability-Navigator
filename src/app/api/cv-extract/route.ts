export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ text: '' })

    if (file.type === 'text/plain') {
      return NextResponse.json({ text: (await file.text()).trim() })
    }

    // PDF/DOCX parsing needs Node.js (pdf-parse/mammoth) — unavailable on Cloudflare Edge.
    // The upload page also supports pasting CV text directly.
    if (
      file.type === 'application/pdf' ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return NextResponse.json({
        text: `[${file.name} uploaded — automatic text extraction is not available here. Use "Paste text" on the upload page, or upload a .txt file.]`,
      })
    }

    return NextResponse.json({ text: `[${file.name} uploaded]` })
  } catch (err) {
    console.error('[cv-extract]', err)
    return NextResponse.json({ text: '' }, { status: 500 })
  }
}
