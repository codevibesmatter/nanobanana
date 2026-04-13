import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { DEFAULT_MODEL, IMAGE_MODELS, type NanobananaOptions } from './types.js'

/**
 * Check if a command is available in PATH
 */
function commandExists(cmd: string): boolean {
  const result = spawnSync('which', [cmd], { encoding: 'utf-8' })
  return result.status === 0
}

/**
 * Check if nanobanana extension is installed in Gemini CLI
 */
function extensionInstalled(): boolean {
  const result = spawnSync('gemini', ['extensions', 'list'], { encoding: 'utf-8' })
  const output = (result.stdout || '') + (result.stderr || '')
  return output.includes('nanobanana')
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
  if (!commandExists('gemini')) {
    console.error('Gemini CLI not installed. Run: npm i -g @google/gemini-cli')
    return 1
  }

  if (!extensionInstalled()) {
    console.error('nanobanana extension not installed.')
    console.error('Run: gemini extensions install https://github.com/gemini-cli-extensions/nanobanana')
    return 1
  }

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
