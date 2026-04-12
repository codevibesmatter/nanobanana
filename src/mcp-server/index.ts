import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { generate, edit, restore, icon, pattern, story, diagram } from '../image-generator.js'

const server = new Server(
  { name: 'nanobanana', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'generate_image',
      description: 'Generate image(s) from a text prompt',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Image description' },
          output: { type: 'string', description: 'Output file path' },
          model: { type: 'string', description: 'Model: flash (default), pro, v1' },
          count: { type: 'number', description: 'Number of variations (1-8)', minimum: 1, maximum: 8 },
          styles: { type: 'array', items: { type: 'string' }, description: 'Artistic styles' },
          variations: { type: 'array', items: { type: 'string' }, description: 'Variation types: lighting, angle, color-palette, composition, mood, season, time-of-day' },
          seed: { type: 'number', description: 'Seed for reproducible generation' },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'edit_image',
      description: 'Edit an existing image with text instructions',
      inputSchema: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Path to image file' },
          instructions: { type: 'string', description: 'Edit instructions' },
          output: { type: 'string', description: 'Output file path' },
          model: { type: 'string' },
        },
        required: ['file', 'instructions'],
      },
    },
    {
      name: 'restore_image',
      description: 'Restore/enhance an old or damaged photo',
      inputSchema: {
        type: 'object',
        properties: {
          file: { type: 'string', description: 'Path to image file' },
          instructions: { type: 'string', description: 'Restoration instructions' },
          output: { type: 'string', description: 'Output file path' },
          model: { type: 'string' },
        },
        required: ['file'],
      },
    },
    {
      name: 'generate_icon',
      description: 'Generate app icons, favicons, or UI elements',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Icon description' },
          output: { type: 'string' },
          model: { type: 'string' },
          size: { type: 'number', enum: [16, 32, 64, 128, 256, 512, 1024] },
          type: { type: 'string', enum: ['app-icon', 'favicon', 'ui-element'] },
          style: { type: 'string', enum: ['flat', 'skeuomorphic', 'minimal', 'modern'] },
          background: { type: 'string', description: 'transparent, white, black, or color' },
          corners: { type: 'string', enum: ['rounded', 'sharp'] },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'generate_pattern',
      description: 'Generate seamless patterns and textures',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Pattern description' },
          output: { type: 'string' },
          model: { type: 'string' },
          size: { type: 'string', description: 'Dimensions, e.g. "256x256"' },
          type: { type: 'string', enum: ['seamless', 'texture', 'wallpaper'] },
          style: { type: 'string', enum: ['geometric', 'organic', 'abstract', 'floral', 'tech'] },
          density: { type: 'string', enum: ['sparse', 'medium', 'dense'] },
          colors: { type: 'string', enum: ['mono', 'duotone', 'colorful'] },
          repeat: { type: 'string', enum: ['tile', 'mirror'] },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'generate_story',
      description: 'Generate sequential image narratives (2-8 frames)',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Story/sequence description' },
          output: { type: 'string' },
          model: { type: 'string' },
          steps: { type: 'number', description: 'Number of frames (2-8)', minimum: 2, maximum: 8 },
          type: { type: 'string', enum: ['story', 'process', 'tutorial', 'timeline'] },
          layout: { type: 'string', enum: ['separate', 'grid', 'comic'] },
          transition: { type: 'string', enum: ['smooth', 'dramatic', 'fade'] },
        },
        required: ['prompt'],
      },
    },
    {
      name: 'generate_diagram',
      description: 'Generate technical diagrams and flowcharts',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Diagram description' },
          output: { type: 'string' },
          model: { type: 'string' },
          type: { type: 'string', enum: ['flowchart', 'architecture', 'network', 'database', 'wireframe', 'mindmap', 'sequence'] },
          style: { type: 'string', enum: ['professional', 'clean', 'hand-drawn', 'technical'] },
          layout: { type: 'string', enum: ['horizontal', 'vertical', 'hierarchical', 'circular'] },
          complexity: { type: 'string', enum: ['simple', 'detailed', 'comprehensive'] },
          colors: { type: 'string', enum: ['mono', 'accent', 'categorical'] },
          annotations: { type: 'string', enum: ['minimal', 'detailed'] },
        },
        required: ['prompt'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'generate_image': {
        const results = await generate(args as any)
        return {
          content: results.map((r) => ({
            type: 'text' as const,
            text: `Generated: ${r.path} (model: ${r.model})`,
          })),
        }
      }

      case 'edit_image': {
        const result = await edit(args as any)
        return {
          content: [{ type: 'text', text: `Edited: ${result.path}` }],
        }
      }

      case 'restore_image': {
        const result = await restore(args as any)
        return {
          content: [{ type: 'text', text: `Restored: ${result.path}` }],
        }
      }

      case 'generate_icon': {
        const result = await icon(args as any)
        return {
          content: [{ type: 'text', text: `Icon: ${result.path}` }],
        }
      }

      case 'generate_pattern': {
        const result = await pattern(args as any)
        return {
          content: [{ type: 'text', text: `Pattern: ${result.path}` }],
        }
      }

      case 'generate_story': {
        const results = await story(args as any)
        return {
          content: results.map((r, i) => ({
            type: 'text' as const,
            text: `Frame ${i + 1}: ${r.path}`,
          })),
        }
      }

      case 'generate_diagram': {
        const result = await diagram(args as any)
        return {
          content: [{ type: 'text', text: `Diagram: ${result.path}` }],
        }
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        }
    }
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('MCP server failed:', err)
  process.exit(1)
})
