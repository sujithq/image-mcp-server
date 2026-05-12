# Azure Image MCP Server

A Model Context Protocol (MCP) server for Azure OpenAI image generation. This server enables AI assistants and development tools like VS Code to generate images using Azure OpenAI's DALL-E models through a standardized MCP interface.

## Features

- **Dual Transport Support**: Works with both stdio (local) and SSE (remote) transports
- **Azure OpenAI Integration**: Leverages Azure OpenAI's image generation capabilities
- **Model Fallback**: Automatic fallback from gpt-image-2 to gpt-image-1.5 for reliability
- **Keyless Authentication**: Uses Microsoft Entra ID (DefaultAzureCredential) for secure, keyless auth
- **Robust Error Handling**: Comprehensive error handling for auth, rate limits, content filters, and timeouts
- **Structured Logging**: Detailed logging for observability and debugging
- **File Persistence**: Saves generated images locally with metadata sidecar files
- **Input Validation**: Zod-based schema validation for safe and reliable operation

## Prerequisites

### Azure Resources

1. **Azure OpenAI Resource**
   - Create an Azure OpenAI resource in a supported region
   - Deploy `gpt-image-2` (primary) and optionally `gpt-image-1.5` (fallback)
   - Note the deployment names and endpoint URL

2. **Identity and Access**

   For **local development** (Azure CLI identity):
   ```bash
   # Sign in with the account that will run the MCP server
   az login

   # Assign role to Azure OpenAI resource
   az role assignment create \
     --assignee $(az ad signed-in-user show --query id -o tsv) \
     --role "Cognitive Services OpenAI User" \
     --scope <azure-openai-resource-id>
   ```

   For **Azure-hosted runtime** (managed identity):
   ```bash
   # Enable managed identity on your host (App Service, Container Apps, etc.)
   az webapp identity assign --name <app-name> --resource-group <rg-name>

   # Assign role to Azure OpenAI resource
   az role assignment create \
     --assignee <managed-identity-principal-id> \
     --role "Cognitive Services OpenAI User" \
     --scope <azure-openai-resource-id>
   ```

### Node.js

- Node.js >= 18.0.0
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd azure-image-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the project root (use `.env.example` as a template):

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_IMAGE_MODEL=gpt-image-2
AZURE_OPENAI_IMAGE_FALLBACK_MODEL=gpt-image-1.5

# Azure Authentication
# Uses DefaultAzureCredential with Azure RBAC. For local development, run `az login`.
# For Azure-hosted user-assigned managed identity, optionally set AZURE_CLIENT_ID.
# AZURE_CLIENT_ID=your-managed-identity-client-id

# Image Output Configuration
IMAGE_OUTPUT_DIR=./output/images

# Transport Configuration
MCP_TRANSPORT_MODE=stdio

# Logging Configuration
LOG_LEVEL=info
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Yes | - | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_IMAGE_MODEL` | No | `gpt-image-2` | Primary image model deployment name |
| `AZURE_OPENAI_IMAGE_FALLBACK_MODEL` | No | - | Fallback model deployment name |
| `AZURE_CLIENT_ID` | No | - | Optional user-assigned managed identity client ID |
| `IMAGE_OUTPUT_DIR` | No | `./output/images` | Directory to save generated images |
| `MCP_TRANSPORT_MODE` | No | `stdio` | Transport mode: stdio, sse, or both |
| `SSE_PORT` | No | `3000` | Port for SSE server (if using sse mode) |
| `SSE_HOST` | No | `localhost` | Host for SSE server (if using sse mode) |
| `LOG_LEVEL` | No | `info` | Logging level: debug, info, warn, error |

## Usage

### Running the Server

**Stdio mode (for local MCP clients like VS Code):**
```bash
npm start
```

**Development mode with watch:**
```bash
npm run dev
```

### VS Code Integration

The server integrates with VS Code through MCP-compatible extensions. There are several ways to use MCP servers with VS Code:

#### Option 1: Using Cline Extension (Recommended)

1. Install the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) from VS Code marketplace
2. Open VS Code settings (File > Preferences > Settings)
3. Search for "Cline: MCP Settings"
4. Add your MCP server configuration:

```json
{
  "cline.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/absolute/path/to/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "IMAGE_OUTPUT_DIR": "/path/to/output/images"
      }
    }
  }
}
```

#### Option 2: Using Claude Code Extension

1. Install the [Claude Code extension](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code)
2. Configure your MCP server in VS Code settings or in your workspace `.vscode/settings.json`:

```json
{
  "claude-code.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "IMAGE_OUTPUT_DIR": "${workspaceFolder}/output/images"
      }
    }
  }
}
```

#### Option 3: Using Continue Extension

1. Install the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue)
2. Add the MCP server to your Continue configuration file (`~/.continue/config.json`):

```json
{
  "mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/absolute/path/to/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "IMAGE_OUTPUT_DIR": "/path/to/output/images"
      }
    }
  }
}
```

### Using the Image Generation Tool

Once connected through your VS Code MCP extension, you can generate images by asking:

```
Generate an image of a serene mountain landscape at sunset with a lake in the foreground
```

The AI assistant will use the `generate_image` tool with appropriate parameters.

## Tool Reference

### `generate_image`

Generate images using Azure OpenAI DALL-E models.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Description of the image to generate (1-4000 chars) |
| `size` | string | No | `1024x1024` | Image dimensions: `1024x1024`, `1024x1792`, `1792x1024` |
| `quality` | string | No | `standard` | Image quality: `standard` or `hd` |
| `n` | number | No | `1` | Number of images to generate (1-10) |
| `output_format` | string | No | `png` | Output format: `png`, `jpeg`, `webp` |
| `output_compression` | string | No | `none` | Compression level: `none`, `low`, `medium`, `high` |
| `background` | string | No | - | Background color or style |
| `user` | string | No | - | User identifier for tracking |
| `model` | string | No | `gpt-image-2` | Model: `gpt-image-2` or `gpt-image-1.5` |

**Response:**

```json
{
  "success": true,
  "filePaths": ["/path/to/image-2024-05-12-001.png"],
  "mimeType": "image/png",
  "dimensions": {
    "width": 1024,
    "height": 1024
  },
  "parameters": {
    "model": "gpt-image-2",
    "size": "1024x1024",
    "quality": "standard",
    "prompt": "A serene mountain landscape..."
  },
  "metadata": [
    {
      "prompt": "A serene mountain landscape...",
      "revisedPrompt": "A tranquil mountain landscape...",
      "model": "gpt-image-2",
      "size": "1024x1024",
      "quality": "standard",
      "timestamp": "2024-05-12T10:30:00.000Z",
      "filename": "image-2024-05-12-001.png"
    }
  ],
  "warnings": []
}
```

## Development

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Test

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Error Handling

The server provides detailed error messages and suggestions:

- **Authentication Errors (401/403)**: Check Azure credentials and role assignments
- **Rate Limit Errors (429)**: Retry with exponential backoff
- **Content Filter Rejections**: Modify prompt to comply with content policies
- **Quota Exceeded**: Check Azure OpenAI quota limits
- **Timeout Errors**: Retry the request

## Model Selection Strategy

1. **Primary Model**: `gpt-image-2` (default)
   - Highest fidelity and detail
   - Broader resolution support (up to 4K)
   - Best for quality-critical applications

2. **Fallback Model**: `gpt-image-1.5` (optional)
   - Better latency and cost efficiency
   - Strong realism and instruction following
   - Automatic fallback on primary model failure

## Architecture

```
src/
├── index.ts              # Main server entry point
├── types/
│   └── index.ts          # TypeScript type definitions
├── schemas/
│   └── imageSchemas.ts   # Zod validation schemas
├── services/
│   └── azureImageService.ts  # Azure OpenAI client
├── tools/
│   └── imageGeneration.ts    # Image generation tool
└── utils/
    ├── config.ts         # Configuration loader
    └── logger.ts         # Structured logger
```

## Troubleshooting

### Authentication Issues

**Problem**: `Authentication failed` or `401/403` errors

**Solutions**:
1. Run `az login` locally, or verify the Azure host has managed identity enabled
2. Ensure your signed-in user or managed identity has the `Cognitive Services OpenAI User` role
3. Check that the role is assigned to the correct Azure OpenAI resource
4. For user-assigned managed identity, verify `AZURE_CLIENT_ID` is set to the managed identity client ID

### Model Not Found

**Problem**: `Model not found` or deployment errors

**Solutions**:
1. Verify deployment names match `AZURE_OPENAI_IMAGE_MODEL` and `AZURE_OPENAI_IMAGE_FALLBACK_MODEL`
2. Ensure models are deployed in your Azure OpenAI resource
3. Check deployment status in Azure Portal

### Image Not Saved

**Problem**: Images not appearing in output directory

**Solutions**:
1. Check `IMAGE_OUTPUT_DIR` path is writable
2. Ensure directory exists or can be created
3. Review logs for file system errors

## Security Best Practices

1. **Never commit secrets**: Keep `.env` file out of version control
2. **Use managed identity in production**: Avoid storing credentials in production environments
3. **Prefer RBAC**: Grant the minimum Azure role needed at the Azure OpenAI resource scope
4. **Use short-lived developer credentials**: Authenticate locally with `az login`
5. **Monitor auth failures**: Set up alerting for repeated authentication failures

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](<repository-url>/issues)
- Azure OpenAI Documentation: https://learn.microsoft.com/azure/ai-services/openai/
- MCP Documentation: https://modelcontextprotocol.io/
