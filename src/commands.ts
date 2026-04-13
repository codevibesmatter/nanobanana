import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
  DiagramFlags,
  EditFlags,
  GenerateFlags,
  IconFlags,
  PatternFlags,
  RestoreFlags,
  StoryFlags,
} from './types.js'

/**
 * Build prompt for generate command with all upstream flags
 */
export function buildGeneratePrompt(basePrompt: string, flags: GenerateFlags): string {
  let prompt = basePrompt

  if (flags.styles?.length) {
    prompt += `\n\nStyles: ${flags.styles.join(', ')}`
  }
  if (flags.variations?.length) {
    prompt += `\n\nCreate variations exploring: ${flags.variations.join(', ')}`
  }
  if (flags.count && flags.count > 1) {
    prompt += `\n\nGenerate ${flags.count} variations.`
  }
  if (flags.format) {
    prompt += `\n\nOutput format: ${flags.format}`
  }
  if (flags.seed !== undefined) {
    prompt += `\n\nUse seed: ${flags.seed} for reproducible generation.`
  }
  if (flags.preview) {
    prompt += '\n\nOpen the result in the default image viewer after saving.'
  }

  return prompt
}

/**
 * Build prompt for edit command
 */
export function buildEditPrompt(file: string, instructions: string, flags: EditFlags): string {
  if (!existsSync(file)) {
    throw new Error(`File not found: ${file}`)
  }
  let prompt = `Edit the image at ${resolve(file)}. Instructions: ${instructions || 'enhance and improve'}`
  if (flags.preview) {
    prompt += '\n\nOpen the result in the default image viewer after saving.'
  }
  return prompt
}

/**
 * Build prompt for restore command
 */
export function buildRestorePrompt(file: string, instructions?: string, flags?: RestoreFlags): string {
  if (!existsSync(file)) {
    throw new Error(`File not found: ${file}`)
  }
  let prompt = `Restore and enhance the image at ${resolve(file)}.`
  if (instructions) {
    prompt += ` ${instructions}`
  } else {
    prompt += ' Fix damage, improve quality, and save back.'
  }
  if (flags?.preview) {
    prompt += '\n\nOpen the result in the default image viewer after saving.'
  }
  return prompt
}

/**
 * Build prompt for icon command with all upstream flags
 */
export function buildIconPrompt(description: string, flags: IconFlags): string {
  let prompt = `Generate a clean, professional icon: ${description}`

  if (flags.size) prompt += `\nSize: ${flags.size}x${flags.size} pixels`
  if (flags.type) prompt += `\nType: ${flags.type}`
  if (flags.style) prompt += `\nStyle: ${flags.style}`
  if (flags.format) prompt += `\nFormat: ${flags.format}`
  if (flags.background) prompt += `\nBackground: ${flags.background}`
  if (flags.corners) prompt += `\nCorners: ${flags.corners}`

  if (!flags.background || flags.background === 'transparent') {
    prompt += '\nOutput as PNG with transparent background.'
  }

  if (flags.preview) {
    prompt += '\n\nOpen the result in the default image viewer after saving.'
  }

  return prompt
}

/**
 * Build prompt for pattern command with all upstream flags
 */
export function buildPatternPrompt(description: string, flags: PatternFlags): string {
  let prompt = `Generate a seamless repeating pattern: ${description}`

  if (flags.size) prompt += `\nSize: ${flags.size}`
  if (flags.type) prompt += `\nType: ${flags.type}`
  if (flags.style) prompt += `\nStyle: ${flags.style}`
  if (flags.density) prompt += `\nDensity: ${flags.density}`
  if (flags.colors) prompt += `\nColor scheme: ${flags.colors}`
  if (flags.repeat) prompt += `\nRepeat mode: ${flags.repeat}`

  prompt += '\nEnsure the pattern tiles seamlessly without visible seams.'

  if (flags.preview) {
    prompt += '\n\nOpen the result in the default image viewer after saving.'
  }

  return prompt
}

/**
 * Build prompt for story command with all upstream flags
 */
export function buildStoryPrompt(description: string, flags: StoryFlags): string {
  const steps = flags.steps || 4
  let prompt = `Generate a ${steps}-step visual sequence: ${description}`

  if (flags.type) prompt += `\nType: ${flags.type}`
  if (flags.style) prompt += `\nStyle consistency: ${flags.style}`
  if (flags.layout) prompt += `\nLayout: ${flags.layout}`
  if (flags.transition) prompt += `\nTransitions: ${flags.transition}`

  prompt += '\nMaintain consistent style, colors, and character design across all frames.'

  if (flags.preview) {
    prompt += '\n\nOpen the results in the default image viewer after saving.'
  }

  return prompt
}

/**
 * Build prompt for diagram command with all upstream flags
 */
export function buildDiagramPrompt(description: string, flags: DiagramFlags): string {
  let prompt = `Generate a technical diagram: ${description}`

  if (flags.type) prompt += `\nDiagram type: ${flags.type}`
  if (flags.style) prompt += `\nVisual style: ${flags.style}`
  if (flags.layout) prompt += `\nLayout: ${flags.layout}`
  if (flags.complexity) prompt += `\nComplexity: ${flags.complexity}`
  if (flags.colors) prompt += `\nColor scheme: ${flags.colors}`
  if (flags.annotations) prompt += `\nAnnotations: ${flags.annotations}`

  prompt += '\nUse professional diagram conventions with clear labels and connections.'

  if (flags.preview) {
    prompt += '\n\nOpen the result in the default image viewer after saving.'
  }

  return prompt
}
