import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_MODEL, IMAGE_MODELS, type NanobananaOptions } from './types.js'

/**
 * Load .env from package root if not already in env
 */
function loadEnv(): void {
  const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const envPath = resolve(pkgRoot, '.env')
  if (!existsSync(envPath)) return

  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq)
    const val = trimmed.slice(eq + 1)
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
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
  loadEnv()
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
