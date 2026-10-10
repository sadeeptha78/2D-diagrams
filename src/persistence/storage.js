const KEY = 'figure-board:document:2'

export function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveLocal(doc) {
  localStorage.setItem(KEY, JSON.stringify(doc))
}

export function downloadText(filename, text, type) {
  downloadBlob(filename, new Blob([text], { type }))
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export async function chooseSaveFile(filename, { description, mime, extension }) {
  if (typeof window.showSaveFilePicker !== 'function') return null
  try {
    return await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description, accept: { [mime]: [extension] } }],
    })
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelled'
    return null
  }
}

export async function writeBlob(handle, blob) {
  const writable = await handle.createWritable()
  await writable.write(blob)
  await writable.close()
}

export function slugify(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return slug || 'figure'
}
