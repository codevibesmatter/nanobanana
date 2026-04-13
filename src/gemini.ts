import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_MODEL, IMAGE_MODELS, type NanobananaOptions } from './types.js'

const OUTPUT_DIR = 'nanobanana-output'

/**
 * Load API key from package .env or environment
 */
function getApiKey(): string {
  // Check env first
  const envKey = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY
  if (envKey) return envKey

  // Fall back to package .env
  const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const envPath = resolve(pkgRoot, '.env')
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const match = line.match(/^(NANOBANANA_API_KEY|GEMINI_API_KEY)=(.+)/)
      if (match) return match[2]
    }
  }

  throw new Error(
    'No API key found. Set NANOBANANA_API_KEY or GEMINI_API_KEY, or add to .env\n' +
    'Get a key: https://aistudio.google.com/apikey',
  )
}

/**
 * Resolve model alias to full model name
 */
export function resolveModel(model?: string): string {
  if (!model) return DEFAULT_MODEL
  return IMAGE_MODELS[model.toLowerCase()] || model
}

/**
 * Sanitize prompt into filename
 */
function promptToFilename(prompt: string, index?: number): string {
  const base = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 32)
    .replace(/_+$/, '')
  const suffix = index !== undefined ? `_${index}` : ''
  return `${base}${suffix}.png`
}

/**
 * Save base64 image to file, return path
 */
function saveImage(base64: string, outputPath: string): string {
  const dir = dirname(outputPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(outputPath, Buffer.from(base64, 'base64'))
  return outputPath
}

/**
 * Resolve where to save — explicit path or auto-generated in output dir
 */
function resolveOutput(explicit?: string, prompt?: string, index?: number): string {
  if (explicit) {
    if (index !== undefined) {
      const ext = explicit.match(/\.\w+$/)?.[0] || '.png'
      return explicit.replace(/\.\w+$/, '') + `_${index}${ext}`
    }
    return resolve(explicit)
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })
  return join(OUTPUT_DIR, promptToFilename(prompt || `image_${Date.now()}`, index))
}

export interface GenerateResult {
  path: string
  model: string
}

/**
 * Call Gemini API to generate image from prompt
 */
export async function callGemini(
  prompt: string,
  options: NanobananaOptions,
): Promise<GenerateResult[]> {
  const { GoogleGenAI } = await import('@google/genai')

  const apiKey = getApiKey()
  const client = new GoogleGenAI({ apiKey })
  const model = resolveModel(options.model)
  const results: GenerateResult[] = []

  console.error(`[nanobanana / ${model}]`)

  const response = await client.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseModalities: ['image', 'text'] },
  })

  if (response.candidates?.[0]?.content?.parts) {
    let imageIndex = 0
    for (const part of response.candidates[0].content.parts) {
      const data = (part as any).inlineData?.data
      if (data && data.length > 1000) {
        const outputPath = resolveOutput(options.output, options.prompt, results.length > 0 ? imageIndex : undefined)
        const saved = saveImage(data, outputPath)
        results.push({ path: saved, model })
        imageIndex++
      }
    }
  }

  if (results.length === 0) {
    // Check if there's a text response explaining why
    const textPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)
    const msg = (textPart as any)?.text || 'No image returned'
    throw new Error(msg)
  }

  return results
}

/**
 * Generate multiple variations by calling API multiple times
 */
export async function callGeminiMulti(
  prompts: string[],
  options: NanobananaOptions,
): Promise<GenerateResult[]> {
  const results: GenerateResult[] = []
  for (let i = 0; i < prompts.length; i++) {
    const opts = { ...options, output: options.output ? resolveOutput(options.output, options.prompt, i) : undefined }
    const r = await callGemini(prompts[i], opts)
    results.push(...r)
  }
  return results
}
