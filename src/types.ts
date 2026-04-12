export interface GenerateOptions {
  prompt: string
  output?: string
  model?: string
  count?: number
  styles?: string[]
  variations?: string[]
  format?: 'grid' | 'separate'
  seed?: number
  preview?: boolean
}

export interface EditOptions {
  file: string
  instructions: string
  output?: string
  model?: string
  preview?: boolean
}

export interface RestoreOptions {
  file: string
  instructions?: string
  output?: string
  model?: string
  preview?: boolean
}

export interface IconOptions {
  prompt: string
  output?: string
  model?: string
  size?: 16 | 32 | 64 | 128 | 256 | 512 | 1024
  type?: 'app-icon' | 'favicon' | 'ui-element'
  style?: 'flat' | 'skeuomorphic' | 'minimal' | 'modern'
  format?: 'png' | 'jpeg'
  background?: 'transparent' | 'white' | 'black' | string
  corners?: 'rounded' | 'sharp'
  preview?: boolean
}

export interface PatternOptions {
  prompt: string
  output?: string
  model?: string
  size?: string // WxH format: "256x256"
  type?: 'seamless' | 'texture' | 'wallpaper'
  style?: 'geometric' | 'organic' | 'abstract' | 'floral' | 'tech'
  density?: 'sparse' | 'medium' | 'dense'
  colors?: 'mono' | 'duotone' | 'colorful'
  repeat?: 'tile' | 'mirror'
  preview?: boolean
}

export interface StoryOptions {
  prompt: string
  output?: string
  model?: string
  steps?: number // 2-8
  type?: 'story' | 'process' | 'tutorial' | 'timeline'
  style?: 'consistent' | 'evolving'
  layout?: 'separate' | 'grid' | 'comic'
  transition?: 'smooth' | 'dramatic' | 'fade'
  preview?: boolean
}

export interface DiagramOptions {
  prompt: string
  output?: string
  model?: string
  type?: 'flowchart' | 'architecture' | 'network' | 'database' | 'wireframe' | 'mindmap' | 'sequence'
  style?: 'professional' | 'clean' | 'hand-drawn' | 'technical'
  layout?: 'horizontal' | 'vertical' | 'hierarchical' | 'circular'
  complexity?: 'simple' | 'detailed' | 'comprehensive'
  colors?: 'mono' | 'accent' | 'categorical'
  annotations?: 'minimal' | 'detailed'
  preview?: boolean
}

export const IMAGE_MODELS: Record<string, string> = {
  flash: 'gemini-3.1-flash-image-preview',
  pro: 'gemini-3-pro-image-preview',
  v1: 'gemini-2.5-flash-image',
}

export const DEFAULT_MODEL = 'gemini-3.1-flash-image-preview'
