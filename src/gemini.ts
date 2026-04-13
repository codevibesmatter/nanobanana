import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_MODEL, IMAGE_MODELS, type NanobananaOptions } from './types.js'

const EXTENSION_ENV = resolve(
  process.env.HOME || '~',
  '.gemini/extensions/nanobanana/.env',
)

/**
 * Ensure the Gemini extension .env has the API key.
 * Reads from our package .env and syncs to the extension.
 */
function syncApiKey(): void {
  const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const pkgEnvPath = resolve(pkgRoot, '.env')

  // Read key from our .env
  let apiKey = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey && existsSync(pkgEnvPath)) {
    const lines = readFileSync(pkgEnvPath, 'utf-8').split('\n')
    for (const line of lines) {
      const match = line.match(/^(NANOBANANA_API_KEY|GEMINI_API_KEY)=(.+)/)
      if (match) {
        apiKey = match[2]
        break
      }
    }
  }

  if (!apiKey) return

  // Sync to extension .env if different or missing
  if (existsSync(EXTENSION_ENV)) {
    const current = readFileSync(EXTENSION_ENV, 'utf-8')
    if (current.includes(apiKey)) return
  }

  writeFileSync(EXTENSION_ENV, `NANOBANANA_API_KEY=${apiKey}\n`)
}

/**
 * Resolve model alias to full model name
 */
export function resolveModel(model?: string): string {
  if (!model) return DEFAULT_MODEL
  return IMAGE_MODELS[model.toLowerCase()] || model
}

/**
 * Build prompt with optional output path instruction
 */
export function buildPrompt(base: string, output?: string): string {
  let prompt = base
  if (output) {
    prompt += `\n\nSave the generated image to: ${resolve(output)}`
  }
  return prompt
}

/**
 * Run gemini CLI with nanobanana extension
 */
export function runGemini(options: NanobananaOptions): number {
  syncApiKey()

  const model = resolveModel(options.model)
  const prompt = buildPrompt(options.prompt, options.output)

  const args = ['-m', model, '-p', prompt]
  if (!options.noYolo) {
    args.push('--yolo')
  }
  args.push('-e', 'nanobanana')

  console.error(`[nanobanana / ${model}]`)

  const result = spawnSync('gemini', args, {
    stdio: 'inherit',
    encoding: 'utf-8',
  })

  return result.status || 0
}
