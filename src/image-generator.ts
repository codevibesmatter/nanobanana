import { GoogleGenAI } from '@google/genai'
import type {
  DiagramOptions,
  EditOptions,
  GenerateOptions,
  IconOptions,
  PatternOptions,
  RestoreOptions,
  StoryOptions,
} from './types.js'
import { DEFAULT_MODEL, IMAGE_MODELS } from './types.js'
import { openPreview, resolveOutputPath, saveImage } from './file-handler.js'

function getClient(): GoogleGenAI {
  const apiKey = process.env.NANOBANANA_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'No API key found. Set NANOBANANA_API_KEY or GEMINI_API_KEY environment variable.\n' +
        'Get a key from: https://aistudio.google.com/apikey',
    )
  }
  return new GoogleGenAI({ apiKey })
}

function resolveModel(model?: string): string {
  if (!model) return DEFAULT_MODEL
  return IMAGE_MODELS[model.toLowerCase()] || model
}

interface GenerateResult {
  path: string
  model: string
}

/**
 * Generate image(s) from text prompt
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult[]> {
  const client = getClient()
  const model = resolveModel(options.model)
  const count = options.count || 1
  const results: GenerateResult[] = []

  let prompt = options.prompt
  if (options.styles?.length) {
    prompt += `\n\nArtistic styles: ${options.styles.join(', ')}`
  }
  if (options.variations?.length) {
    prompt += `\n\nCreate variations exploring: ${options.variations.join(', ')}`
  }
  if (options.seed !== undefined) {
    prompt += `\n\nUse seed: ${options.seed}`
  }

  for (let i = 0; i < count; i++) {
    const iterPrompt = count > 1 ? `${prompt}\n\nVariation ${i + 1} of ${count}.` : prompt

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: iterPrompt }] }],
      config: { responseModalities: ['image', 'text'] },
    })

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData?.mimeType?.startsWith('image/'),
    )

    if (imagePart?.inlineData?.data) {
      const suffix = count > 1 ? `_${i + 1}` : ''
      const outputPath = resolveOutputPath(
        options.output ? options.output.replace(/\.png$/, `${suffix}.png`) : undefined,
        `${options.prompt}${suffix}`,
      )
      const saved = saveImage(imagePart.inlineData.data, outputPath)
      results.push({ path: saved, model })

      if (options.preview) {
        await openPreview(saved)
      }
    }
  }

  return results
}

/**
 * Edit an existing image with instructions
 */
export async function edit(options: EditOptions): Promise<GenerateResult> {
  const client = getClient()
  const model = resolveModel(options.model)
  const { readFileSync } = await import('node:fs')

  const imageData = readFileSync(options.file).toString('base64')
  const mimeType = options.file.endsWith('.png') ? 'image/png' : 'image/jpeg'

  const response = await client.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageData } },
          { text: `Edit this image: ${options.instructions}` },
        ],
      },
    ],
    config: { responseModalities: ['image', 'text'] },
  })

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.mimeType?.startsWith('image/'),
  )

  if (!imagePart?.inlineData?.data) {
    throw new Error('No image returned from edit request')
  }

  const outputPath = resolveOutputPath(options.output, `edited_${options.file}`)
  const saved = saveImage(imagePart.inlineData.data, outputPath)

  if (options.preview) await openPreview(saved)

  return { path: saved, model }
}

/**
 * Restore/enhance an old or damaged photo
 */
export async function restore(options: RestoreOptions): Promise<GenerateResult> {
  const instructions =
    options.instructions || 'Restore and enhance this image. Fix damage, improve quality.'
  return edit({
    file: options.file,
    instructions,
    output: options.output,
    model: options.model,
    preview: options.preview,
  })
}

/**
 * Generate an icon
 */
export async function icon(options: IconOptions): Promise<GenerateResult> {
  let prompt = `Generate a clean, professional icon: ${options.prompt}`
  if (options.size) prompt += `\nSize: ${options.size}x${options.size} pixels`
  if (options.type) prompt += `\nType: ${options.type}`
  if (options.style) prompt += `\nStyle: ${options.style}`
  if (options.background) prompt += `\nBackground: ${options.background}`
  if (options.corners) prompt += `\nCorners: ${options.corners}`
  prompt += `\nOutput as ${options.format || 'PNG'}${options.background === 'transparent' || !options.background ? ' with transparent background' : ''}.`

  const results = await generate({
    prompt,
    output: options.output,
    model: options.model,
    preview: options.preview,
  })

  return results[0]
}

/**
 * Generate a seamless pattern
 */
export async function pattern(options: PatternOptions): Promise<GenerateResult> {
  let prompt = `Generate a seamless repeating pattern: ${options.prompt}`
  if (options.size) prompt += `\nSize: ${options.size}`
  if (options.type) prompt += `\nType: ${options.type}`
  if (options.style) prompt += `\nStyle: ${options.style}`
  if (options.density) prompt += `\nDensity: ${options.density}`
  if (options.colors) prompt += `\nColor scheme: ${options.colors}`
  if (options.repeat) prompt += `\nRepeat mode: ${options.repeat}`
  prompt += '\nEnsure the pattern tiles seamlessly without visible seams.'

  const results = await generate({
    prompt,
    output: options.output,
    model: options.model,
    preview: options.preview,
  })

  return results[0]
}

/**
 * Generate sequential story images
 */
export async function story(options: StoryOptions): Promise<GenerateResult[]> {
  const steps = options.steps || 4
  let prompt = `Generate a ${steps}-step visual sequence: ${options.prompt}`
  if (options.type) prompt += `\nType: ${options.type}`
  if (options.style) prompt += `\nStyle consistency: ${options.style}`
  if (options.layout) prompt += `\nLayout: ${options.layout}`
  if (options.transition) prompt += `\nTransitions: ${options.transition}`
  prompt += '\nMaintain consistent style, colors, and character design across all frames.'

  return generate({
    prompt,
    output: options.output,
    model: options.model,
    count: steps,
    preview: options.preview,
  })
}

/**
 * Generate a technical diagram
 */
export async function diagram(options: DiagramOptions): Promise<GenerateResult> {
  let prompt = `Generate a technical diagram: ${options.prompt}`
  if (options.type) prompt += `\nDiagram type: ${options.type}`
  if (options.style) prompt += `\nVisual style: ${options.style}`
  if (options.layout) prompt += `\nLayout: ${options.layout}`
  if (options.complexity) prompt += `\nComplexity: ${options.complexity}`
  if (options.colors) prompt += `\nColor scheme: ${options.colors}`
  if (options.annotations) prompt += `\nAnnotations: ${options.annotations}`
  prompt += '\nUse professional diagram conventions with clear labels and connections.'

  const results = await generate({
    prompt,
    output: options.output,
    model: options.model,
    preview: options.preview,
  })

  return results[0]
}
