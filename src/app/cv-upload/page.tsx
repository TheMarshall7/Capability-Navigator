'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Btn } from '@/components/ui/Btn'
import { Card } from '@/components/ui/Card'

export default function CVUploadPage() {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowed.includes(f.type)) { setError('Please upload a PDF, Word document, or TXT file.'); return }
    if (f.size > 10 * 1024 * 1024) { setError('File must be under 10MB.'); return }
    setFile(f)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSave = async () => {
    setUploading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete previous CV from storage (if any) before uploading new one
      if (file) {
        const { data: existingCV } = await supabase
          .from('cv_uploads')
          .select('file_url')
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingCV?.file_url) {
          // Extract path from URL and delete from storage
          const oldPath = existingCV.file_url.split('/cv-uploads/')[1]
          if (oldPath) {
            await supabase.storage.from('cv-uploads').remove([oldPath])
          }
        }
      }

      let extractedText = pasteText
      let fileUrl = ''
      let fileName = 'pasted-text.txt'

      if (file) {
        fileName = file.name
        // Upload file to Supabase Storage
        const filePath = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage.from('cv-uploads').upload(filePath, file, { upsert: true })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('cv-uploads').getPublicUrl(filePath)
        fileUrl = publicUrl

        // Extract text via API
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/cv-extract', { method: 'POST', body: formData })
        if (res.ok) {
          const { text } = await res.json()
          extractedText = text
        }
      }

      if (!extractedText && !file) { setError('Please upload a file or paste your CV text.'); setUploading(false); return }

      // Upsert cv_uploads record
      const { error: dbError } = await supabase.from('cv_uploads').upsert({
        user_id: user.id,
        file_url: fileUrl,
        file_name: fileName,
        extracted_text: extractedText || `[File uploaded: ${fileName}]`,
      }, { onConflict: 'user_id' })

      if (dbError) throw dbError
      router.push('/questionnaire')
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-[600px] mx-auto px-6 py-12">
      <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-lora)' }}>Upload your CV</h1>
      <p className="text-[#7A756F] mb-8 leading-relaxed">
        Your CV is the starting point — not the whole story. We use it as evidence alongside your questionnaire answers.
      </p>

      {/* Tab */}
      <div className="flex bg-[#F8F6F1] rounded-xl p-1 mb-6">
        {(['upload', 'paste'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none transition-all"
            style={{ background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#2D2926' : '#7A756F' }}>
            {m === 'upload' ? 'Upload file' : 'Paste text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all"
            style={{ borderColor: dragging ? '#E07A5F' : file ? '#3D8A7A' : '#E8E3DA', background: dragging ? '#FDF0EA' : file ? '#EBF5F3' : '#fff' }}>
            {file ? (
              <>
                <div className="text-4xl mb-3">✓</div>
                <div className="font-semibold text-[#3D8A7A] mb-1">{file.name}</div>
                <div className="text-sm text-[#7A756F]">{(file.size / 1024).toFixed(0)}KB · Click to replace</div>
              </>
            ) : (
              <>
                <div className="text-4xl text-[#7A756F] mb-3">↑</div>
                <div className="font-semibold mb-2">Drop your CV here or click to browse</div>
                <div className="text-sm text-[#7A756F]">PDF, DOC, DOCX, or TXT · Max 10MB</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
        </>
      ) : (
        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder="Paste your CV text here..."
          className="w-full min-h-[280px] p-4 border border-[#E8E3DA] rounded-2xl text-sm leading-relaxed resize-y outline-none focus:border-[#E07A5F] transition-colors"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        />
      )}

      {error && <div className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-4 py-3">{error}</div>}

      <div className="mt-4 p-4 bg-[#FDF0EA] rounded-xl">
        <p className="text-sm text-[#7A756F] leading-relaxed">
          🔒 Your CV is stored securely and never shared with employers. Delete it anytime from Settings.
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <Btn variant="outline" onClick={() => router.push('/dashboard')}>← Back</Btn>
        <Btn onClick={handleSave} loading={uploading}>
          {file || pasteText ? 'Save & continue →' : 'Skip for now →'}
        </Btn>
      </div>
    </div>
  )
}
