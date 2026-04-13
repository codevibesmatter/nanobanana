#!/usr/bin/env node

import { runGemini } from './gemini.js'
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

function parseBoolFlag(args: string[]): boolean {
  const idx = args.indexOf('--preview')
  if (idx === -1) return false
  args.splice(idx, 1)
  return true
}

function removeFlags(args: string[], flags: string[]): void {
  for (const flag of flags) {
    const idx = args.indexOf(flag)
    if (idx !== -1) args.splice(idx, 1)
  }
}

function printHelp() {
  console.log(`
nanobanana - AI image generation via Gemini CLI

Wraps the nanobanana Gemini CLI extension with full flag support.
Auth is handled by Gemini CLI (run \`gemini\` once to authenticate).

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
  --no-yolo       Require approval for tool calls
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
  --img-format    png, jpeg
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
  nanobanana pattern "geometric waves" --pattern-style geometric --colors duotone
  nanobanana story "user onboarding flow" --type tutorial --steps 5
  nanobanana diagram "microservice architecture" --type architecture --layout horizontal

PREREQUISITES:
  npm i -g @google/gemini-cli
  gemini extensions install https://github.com/gemini-cli-extensions/nanobanana
`)
}

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printHelp()
    process.exit(0)
  }

  // Global flags
  const output = parseFlag(args, '-o') || parseFlag(args, '--output')
  const model = parseFlag(args, '-m') || parseFlag(args, '--model')
  const noYolo = args.includes('--no-yolo')
  removeFlags(args, ['--no-yolo'])
  const preview = parseBoolFlag(args)

  const subcommand = args[0]

  try {
    let prompt: string

    switch (subcommand) {
      case 'edit': {
        const file = args[1]
        const instructions = args.slice(2).join(' ')
        if (!file) {
          console.error('Usage: nanobanana edit <image> "instructions"')
          process.exit(1)
        }
        prompt = buildEditPrompt(file, instructions, { preview })
        break
      }

      case 'restore': {
        const file = args[1]
        const instructions = args.slice(2).join(' ') || undefined
        if (!file) {
          console.error('Usage: nanobanana restore <image> ["instructions"]')
          process.exit(1)
        }
        prompt = buildRestorePrompt(file, instructions, { preview })
        break
      }

      case 'icon': {
        const desc = args.slice(1).join(' ')
        if (!desc) {
          console.error('Usage: nanobanana icon "description"')
          process.exit(1)
        }
        prompt = buildIconPrompt(desc, {
          size: parseFlag(args, '--size') ? parseInt(parseFlag(args, '--size')!) : undefined,
          type: parseFlag(args, '--type'),
          style: parseFlag(args, '--icon-style'),
          format: parseFlag(args, '--img-format'),
          background: parseFlag(args, '--background'),
          corners: parseFlag(args, '--corners'),
          preview,
        })
        break
      }

      case 'pattern': {
        const desc = args.slice(1).join(' ')
        if (!desc) {
          console.error('Usage: nanobanana pattern "description"')
          process.exit(1)
        }
        prompt = buildPatternPrompt(desc, {
          size: parseFlag(args, '--size'),
          type: parseFlag(args, '--type'),
          style: parseFlag(args, '--pattern-style'),
          density: parseFlag(args, '--density'),
          colors: parseFlag(args, '--colors'),
          repeat: parseFlag(args, '--repeat'),
          preview,
        })
        break
      }

      case 'story': {
        const desc = args.slice(1).join(' ')
        if (!desc) {
          console.error('Usage: nanobanana story "description"')
          process.exit(1)
        }
        prompt = buildStoryPrompt(desc, {
          steps: parseFlag(args, '--steps') ? parseInt(parseFlag(args, '--steps')!) : undefined,
          type: parseFlag(args, '--type'),
          style: parseFlag(args, '--story-style'),
          layout: parseFlag(args, '--layout'),
          transition: parseFlag(args, '--transition'),
          preview,
        })
        break
      }

      case 'diagram': {
        const desc = args.slice(1).join(' ')
        if (!desc) {
          console.error('Usage: nanobanana diagram "description"')
          process.exit(1)
        }
        prompt = buildDiagramPrompt(desc, {
          type: parseFlag(args, '--type'),
          style: parseFlag(args, '--diagram-style'),
          layout: parseFlag(args, '--layout'),
          complexity: parseFlag(args, '--complexity'),
          colors: parseFlag(args, '--colors'),
          annotations: parseFlag(args, '--annotations'),
          preview,
        })
        break
      }

      default: {
        // Default: generate
        const count = parseFlag(args, '-n') || parseFlag(args, '--count')
        const style = parseFlag(args, '--style')
        const variations = parseFlag(args, '--variations')
        const format = parseFlag(args, '--format')
        const seed = parseFlag(args, '--seed')

        prompt = buildGeneratePrompt(args.join(' '), {
          count: count ? parseInt(count) : undefined,
          styles: style ? style.split(',') : undefined,
          variations: variations ? variations.split(',') : undefined,
          format,
          seed: seed ? parseInt(seed) : undefined,
          preview,
        })
        break
      }
    }

    const exitCode = runGemini({ prompt, output, model, noYolo })
    process.exit(exitCode)
  } catch (err: any) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

main()
