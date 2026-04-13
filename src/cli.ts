#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { callGemini, callGeminiMulti } from './gemini.js'
import {
  buildGeneratePrompt,
  buildEditPrompt,
  buildRestorePrompt,
  buildIconPrompt,
  buildPatternPrompt,
  buildStoryPrompt,
  buildDiagramPrompt,
} from './commands.js'

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  if (idx === -1) return undefined
  const val = args[idx + 1]
  args.splice(idx, 2)
  return val
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

Direct API — no gemini CLI needed. Just set NANOBANANA_API_KEY or GEMINI_API_KEY.

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
  --story-style   consistent, evolving
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
  nanobanana diagram "microservice architecture" --type architecture

ENVIRONMENT:
  NANOBANANA_API_KEY   Gemini API key (or GEMINI_API_KEY)
  Also reads from .env in package root.
  Get a key: https://aistudio.google.com/apikey
`)
}

async function openPreview(filePath: string): Promise<void> {
  const { exec } = await import('node:child_process')
  const { platform } = await import('node:os')
  const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} "${filePath}"`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp()
    process.exit(0)
  }

  // Global flags
  const output = parseFlag(args, '-o') || parseFlag(args, '--output')
  const model = parseFlag(args, '-m') || parseFlag(args, '--model')
  const preview = parseBoolFlag(args, '--preview')

  const subcommand = args[0]

  try {
    let results: { path: string; model: string }[]

    switch (subcommand) {
      case 'edit': {
        const file = args[1]
        const instructions = args.slice(2).join(' ')
        if (!file || !existsSync(file)) {
          console.error(file ? `File not found: ${file}` : 'Usage: nanobanana edit <image> "instructions"')
          process.exit(1)
        }
        const prompt = buildEditPrompt(file, instructions, { preview })
        results = await callGemini(prompt, { prompt, output, model })
        break
      }

      case 'restore': {
        const file = args[1]
        if (!file || !existsSync(file)) {
          console.error(file ? `File not found: ${file}` : 'Usage: nanobanana restore <image>')
          process.exit(1)
        }
        const instructions = args.slice(2).join(' ') || undefined
        const prompt = buildRestorePrompt(file, instructions, { preview })
        results = await callGemini(prompt, { prompt, output, model })
        break
      }

      case 'icon': {
        const size = parseFlag(args, '--size')
        const type = parseFlag(args, '--type')
        const iconStyle = parseFlag(args, '--icon-style')
        const background = parseFlag(args, '--background')
        const corners = parseFlag(args, '--corners')
        const desc = args.slice(1).join(' ')
        if (!desc) { console.error('Usage: nanobanana icon "description"'); process.exit(1) }
        const prompt = buildIconPrompt(desc, {
          size: size ? parseInt(size) : undefined,
          type, style: iconStyle, background, corners, preview,
        })
        results = await callGemini(prompt, { prompt: desc, output, model })
        break
      }

      case 'pattern': {
        const size = parseFlag(args, '--size')
        const type = parseFlag(args, '--type')
        const patternStyle = parseFlag(args, '--pattern-style')
        const density = parseFlag(args, '--density')
        const colors = parseFlag(args, '--colors')
        const repeat = parseFlag(args, '--repeat')
        const desc = args.slice(1).join(' ')
        if (!desc) { console.error('Usage: nanobanana pattern "description"'); process.exit(1) }
        const prompt = buildPatternPrompt(desc, {
          size, type, style: patternStyle, density, colors, repeat, preview,
        })
        results = await callGemini(prompt, { prompt: desc, output, model })
        break
      }

      case 'story': {
        const steps = parseFlag(args, '--steps')
        const type = parseFlag(args, '--type')
        const storyStyle = parseFlag(args, '--story-style')
        const layout = parseFlag(args, '--layout')
        const transition = parseFlag(args, '--transition')
        const desc = args.slice(1).join(' ')
        if (!desc) { console.error('Usage: nanobanana story "description"'); process.exit(1) }
        const stepCount = steps ? parseInt(steps) : 4
        const prompts: string[] = []
        for (let i = 0; i < stepCount; i++) {
          prompts.push(buildStoryPrompt(desc, {
            steps: stepCount, type, style: storyStyle, layout, transition, preview,
          }) + `\n\nThis is frame ${i + 1} of ${stepCount}.`)
        }
        results = await callGeminiMulti(prompts, { prompt: desc, output, model })
        break
      }

      case 'diagram': {
        const type = parseFlag(args, '--type')
        const diagramStyle = parseFlag(args, '--diagram-style')
        const layout = parseFlag(args, '--layout')
        const complexity = parseFlag(args, '--complexity')
        const colors = parseFlag(args, '--colors')
        const annotations = parseFlag(args, '--annotations')
        const desc = args.slice(1).join(' ')
        if (!desc) { console.error('Usage: nanobanana diagram "description"'); process.exit(1) }
        const prompt = buildDiagramPrompt(desc, {
          type, style: diagramStyle, layout, complexity, colors, annotations, preview,
        })
        results = await callGemini(prompt, { prompt: desc, output, model })
        break
      }

      default: {
        // Default: generate
        const count = parseFlag(args, '-n') || parseFlag(args, '--count')
        const style = parseFlag(args, '--style')
        const variations = parseFlag(args, '--variations')
        const seed = parseFlag(args, '--seed')
        const basePrompt = args.join(' ')

        if (count && parseInt(count) > 1) {
          const prompts: string[] = []
          for (let i = 0; i < parseInt(count); i++) {
            prompts.push(buildGeneratePrompt(basePrompt, {
              styles: style ? style.split(',') : undefined,
              variations: variations ? variations.split(',') : undefined,
              seed: seed ? parseInt(seed) : undefined,
              preview,
            }) + `\n\nVariation ${i + 1} of ${count}.`)
          }
          results = await callGeminiMulti(prompts, { prompt: basePrompt, output, model })
        } else {
          const prompt = buildGeneratePrompt(basePrompt, {
            styles: style ? style.split(',') : undefined,
            variations: variations ? variations.split(',') : undefined,
            seed: seed ? parseInt(seed) : undefined,
            preview,
          })
          results = await callGemini(prompt, { prompt: basePrompt, output, model })
        }
        break
      }
    }

    for (const r of results) {
      console.log(r.path)
      if (preview) await openPreview(r.path)
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

main()
