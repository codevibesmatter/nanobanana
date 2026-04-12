import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

const OUTPUT_DIR = 'nanobanana-output'

/**
 * Sanitize a prompt into a valid filename
 */
export function promptToFilename(prompt: string, ext = 'png'): string {
  return (
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 32)
      .replace(/_+$/, '') + `.${ext}`
  )
}

/**
 * Resolve output path — uses explicit path or generates one in output dir
 */
export function resolveOutputPath(explicitPath?: string, prompt?: string): string {
  if (explicitPath) {
    const resolved = resolve(explicitPath)
    const dir = dirname(resolved)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    return resolved
  }

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  const filename = prompt ? promptToFilename(prompt) : `image_${Date.now()}.png`
  let path = join(OUTPUT_DIR, filename)

  // Prevent duplicates
  let counter = 1
  while (existsSync(path)) {
    const base = basename(filename, '.png')
    path = join(OUTPUT_DIR, `${base}_${counter}.png`)
    counter++
  }

  return path
}

/**
 * Save base64 image data to file
 */
export function saveImage(base64Data: string, outputPath: string): string {
  const resolved = resolve(outputPath)
  const dir = dirname(resolved)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(resolved, Buffer.from(base64Data, 'base64'))
  return resolved
}

/**
 * Open file in default viewer (platform-specific)
 */
export async function openPreview(filePath: string): Promise<void> {
  const { exec } = await import('node:child_process')
  const { platform } = await import('node:os')

  const cmd =
    platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open'

  exec(`${cmd} "${filePath}"`)
}
