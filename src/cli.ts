#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { generate, edit, restore, icon, pattern, story, diagram } from './image-generator.js'
import type { IconOptions } from './types.js'

function parseFlag(args: string[], flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag)
  if (idx === -1) return defaultValue
  const val = args[idx + 1]
  args.splice(idx, 2)
  return val || defaultValue
}

function parseBoolFlag(args: string[], flag: string): boolean {
  const idx = args.indexOf(flag)
  if (idx === -1) return false
  args.splice(idx, 1)
  return true
}

function printHelp() {
  console.log(`
nanobanana - AI image generation via Google Gemini

USAGE:
  nanobanana "prompt"                              Generate image
  nanobanana edit <image> "instructions"           Edit existing image
  nanobanana restore <image> ["instructions"]      Restore old/damaged photo
  nanobanana icon "description" [options]          Generate icon
  nanobanana pattern "description" [options]       Generate seamless pattern
  nanobanana story "description" [options]         Generate image sequence
  nanobanana diagram "description" [options]       Generate technical diagram

MODELS:
  flash       gemini-3.1-flash-image-preview (default)
  pro         gemini-3-pro-image-preview
  v1          gemini-2.5-flash-image

GLOBAL OPTIONS:
  -o, --output    Save to specific path
  -m, --model     Model alias or full name
  --preview       Open result in default viewer

GENERATE OPTIONS:
  -n, --count     Number of variations (1-8)
  --style         Artistic style(s), comma-separated
  --variations    Variation types: lighting,angle,color-palette,composition,mood,season,time-of-day
  --format        Output format: grid, separate
  --seed          Seed for reproducible generation

ICON OPTIONS:
  --size          Icon size: 16, 32, 64, 128, 256, 512, 1024
  --type          app-icon, favicon, ui-element
  --icon-style    flat, skeuomorphic, minimal, modern
  --background    transparent, white, black, or color
  --corners       rounded, sharp

PATTERN OPTIONS:
  --size          Dimensions (e.g., "256x256")
  --type          seamless, texture, wallpaper
  --pattern-style geometric, organic, abstract, floral, tech
  --density       sparse, medium, dense
  --colors        mono, duotone, colorful
  --repeat        tile, mirror

STORY OPTIONS:
  --steps         Number of frames (2-8, default: 4)
  --type          story, process, tutorial, timeline
  --layout        separate, grid, comic
  --transition    smooth, dramatic, fade

DIAGRAM OPTIONS:
  --type          flowchart, architecture, network, database, wireframe, mindmap, sequence
  --diagram-style professional, clean, hand-drawn, technical
  --layout        horizontal, vertical, hierarchical, circular
  --complexity    simple, detailed, comprehensive
  --colors        mono, accent, categorical
  --annotations   minimal, detailed

EXAMPLES:
  nanobanana "a futuristic cityscape at sunset"
  nanobanana "banana mascot" -n 4 --style watercolor
  nanobanana edit photo.jpg "remove background"
  nanobanana icon "database with lightning" --size 512 --type app-icon
  nanobanana pattern "geometric waves" --style geometric --colors duotone
  nanobanana story "user onboarding flow" --type tutorial --steps 5
  nanobanana diagram "microservice architecture" --type architecture --layout horizontal

ENVIRONMENT:
  NANOBANANA_API_KEY   Gemini API key (or GEMINI_API_KEY)
  Get a key: https://aistudio.google.com/apikey
`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp()
    process.exit(0)
  }

  // Global flags (mutate args array)
  const output = parseFlag(args, '-o', '') || parseFlag(args, '--output', '')
  const model = parseFlag(args, '-m', '') || parseFlag(args, '--model', '')
  const preview = parseBoolFlag(args, '--preview')

  const subcommand = args[0]

  try {
    switch (subcommand) {
      case 'edit': {
        const file = args[1]
        const instructions = args.slice(2).join(' ')
        if (!file) {
          console.error('Usage: nanobanana edit <image> "instructions"')
          process.exit(1)
        }
        if (!existsSync(file)) {
          console.error(`File not found: ${file}`)
          process.exit(1)
        }
        const result = await edit({
          file: resolve(file),
          instructions: instructions || 'enhance and improve',
          output: output || undefined,
          model: model || undefined,
          preview,
        })
        console.log(result.path)
        break
      }

      case 'restore': {
        const file = args[1]
        const instructions = args.slice(2).join(' ') || undefined
        if (!file) {
          console.error('Usage: nanobanana restore <image> ["instructions"]')
          process.exit(1)
        }
        if (!existsSync(file)) {
          console.error(`File not found: ${file}`)
          process.exit(1)
        }
        const result = await restore({
          file: resolve(file),
          instructions,
          output: output || undefined,
          model: model || undefined,
          preview,
        })
        console.log(result.path)
        break
      }

      case 'icon': {
        const prompt = args.slice(1).join(' ')
        if (!prompt) {
          console.error('Usage: nanobanana icon "description"')
          process.exit(1)
        }
        const size = parseFlag(args, '--size', '') as any
        const type = parseFlag(args, '--type', '') as any
        const iconStyle = parseFlag(args, '--icon-style', '') as any
        const background = parseFlag(args, '--background', '') as any
        const corners = parseFlag(args, '--corners', '') as any

        const result = await icon({
          prompt,
          output: output || undefined,
          model: model || undefined,
          size: size ? (parseInt(size) as IconOptions['size']) : undefined,
          type: type || undefined,
          style: iconStyle || undefined,
          background: background || undefined,
          corners: corners || undefined,
          preview,
        })
        console.log(result.path)
        break
      }

      case 'pattern': {
        const prompt = args.slice(1).join(' ')
        if (!prompt) {
          console.error('Usage: nanobanana pattern "description"')
          process.exit(1)
        }
        const size = parseFlag(args, '--size', '')
        const type = parseFlag(args, '--type', '') as any
        const patternStyle = parseFlag(args, '--pattern-style', '') as any
        const density = parseFlag(args, '--density', '') as any
        const colors = parseFlag(args, '--colors', '') as any
        const repeat = parseFlag(args, '--repeat', '') as any

        const result = await pattern({
          prompt,
          output: output || undefined,
          model: model || undefined,
          size: size || undefined,
          type: type || undefined,
          style: patternStyle || undefined,
          density: density || undefined,
          colors: colors || undefined,
          repeat: repeat || undefined,
          preview,
        })
        console.log(result.path)
        break
      }

      case 'story': {
        const prompt = args.slice(1).join(' ')
        if (!prompt) {
          console.error('Usage: nanobanana story "description"')
          process.exit(1)
        }
        const steps = parseFlag(args, '--steps', '')
        const type = parseFlag(args, '--type', '') as any
        const layout = parseFlag(args, '--layout', '') as any
        const transition = parseFlag(args, '--transition', '') as any

        const results = await story({
          prompt,
          output: output || undefined,
          model: model || undefined,
          steps: steps ? parseInt(steps) : undefined,
          type: type || undefined,
          layout: layout || undefined,
          transition: transition || undefined,
          preview,
        })
        for (const r of results) console.log(r.path)
        break
      }

      case 'diagram': {
        const prompt = args.slice(1).join(' ')
        if (!prompt) {
          console.error('Usage: nanobanana diagram "description"')
          process.exit(1)
        }
        const type = parseFlag(args, '--type', '') as any
        const diagramStyle = parseFlag(args, '--diagram-style', '') as any
        const layout = parseFlag(args, '--layout', '') as any
        const complexity = parseFlag(args, '--complexity', '') as any
        const colors = parseFlag(args, '--colors', '') as any
        const annotations = parseFlag(args, '--annotations', '') as any

        const result = await diagram({
          prompt,
          output: output || undefined,
          model: model || undefined,
          type: type || undefined,
          style: diagramStyle || undefined,
          layout: layout || undefined,
          complexity: complexity || undefined,
          colors: colors || undefined,
          annotations: annotations || undefined,
          preview,
        })
        console.log(result.path)
        break
      }

      default: {
        // Default: treat everything as a generate prompt
        const prompt = args.join(' ')
        const count = parseFlag(args, '-n', '') || parseFlag(args, '--count', '')
        const style = parseFlag(args, '--style', '')
        const variations = parseFlag(args, '--variations', '')
        const format = parseFlag(args, '--format', '') as any
        const seed = parseFlag(args, '--seed', '')

        const results = await generate({
          prompt,
          output: output || undefined,
          model: model || undefined,
          count: count ? parseInt(count) : undefined,
          styles: style ? style.split(',') : undefined,
          variations: variations ? variations.split(',') : undefined,
          format: format || undefined,
          seed: seed ? parseInt(seed) : undefined,
          preview,
        })
        for (const r of results) console.log(r.path)
        break
      }
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

main()
