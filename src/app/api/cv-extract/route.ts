import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ text: '' })

    const buffer = Buffer.from(await file.arrayBuffer())

    if (file.type === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default
        const { text } = await pdfParse(buffer)
        return NextResponse.json({ text: text.trim() })
      } catch {
        return NextResponse.json({ text: '[PDF uploaded — text extraction unavailable in this environment]' })
      }
    }

    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const mammoth = await import('mammoth')
        const { value: text } = await mammoth.extractRawText({ buffer })
        return NextResponse.json({ text: text.trim() })
      } catch {
        return NextResponse.json({ text: '[Word document uploaded — text extraction unavailable in this environment]' })
      }
    }

    if (file.type === 'text/plain') {
      return NextResponse.json({ text: buffer.toString('utf-8').trim() })
    }

    return NextResponse.json({ text: `[${file.name} uploaded]` })
  } catch (err) {
    console.error('[cv-extract]', err)
    return NextResponse.json({ text: '' }, { status: 500 })
  }
}
