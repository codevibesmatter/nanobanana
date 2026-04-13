export const IMAGE_MODELS: Record<string, string> = {
  flash: 'gemini-3.1-flash-image-preview',
  pro: 'gemini-3-pro-image-preview',
  v1: 'gemini-2.5-flash-image',
}

export const DEFAULT_MODEL = 'gemini-3.1-flash-image-preview'

export interface NanobananaOptions {
  prompt: string
  output?: string
  model?: string
  noYolo?: boolean
}

export interface GenerateFlags {
  count?: number
  styles?: string[]
  variations?: string[]
  format?: string
  seed?: number
  preview?: boolean
}

export interface IconFlags {
  size?: number
  type?: string
  style?: string
  format?: string
  background?: string
  corners?: string
  preview?: boolean
}

export interface PatternFlags {
  size?: string
  type?: string
  style?: string
  density?: string
  colors?: string
  repeat?: string
  preview?: boolean
}

export interface StoryFlags {
  steps?: number
  type?: string
  style?: string
  layout?: string
  transition?: string
  preview?: boolean
}

export interface DiagramFlags {
  type?: string
  style?: string
  layout?: string
  complexity?: string
  colors?: string
  annotations?: string
  preview?: boolean
}

export interface EditFlags {
  preview?: boolean
}

export interface RestoreFlags {
  preview?: boolean
}
