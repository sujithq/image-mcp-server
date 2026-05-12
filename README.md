# Azure Image MCP Server

A Model Context Protocol (MCP) server for Azure OpenAI image generation. This server enables AI assistants like Claude to generate images using Azure OpenAI's DALL-E models through a standardized MCP interface.

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

   For **local development/CI** (service principal):
   ```bash
   # Create service principal
   az ad sp create-for-rbac --name azure-image-mcp-sp

   # Assign role to Azure OpenAI resource
   az role assignment create \
     --assignee <service-principal-client-id> \
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

# Azure Authentication (for local development with service principal)
# In production with managed identity, these can be omitted
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

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
| `AZURE_TENANT_ID` | Local only | - | Azure AD tenant ID (service principal) |
| `AZURE_CLIENT_ID` | Local only | - | Service principal client ID |
| `AZURE_CLIENT_SECRET` | Local only | - | Service principal client secret |
| `IMAGE_OUTPUT_DIR` | No | `./output/images` | Directory to save generated images |
| `MCP_TRANSPORT_MODE` | No | `stdio` | Transport mode: stdio, sse, or both |
| `SSE_PORT` | No | `3000` | Port for SSE server (if using sse mode) |
| `SSE_HOST` | No | `localhost` | Host for SSE server (if using sse mode) |
| `LOG_LEVEL` | No | `info` | Logging level: debug, info, warn, error |

## Usage

### Running the Server

**Stdio mode (for local MCP clients like Claude Desktop):**
```bash
npm start
```

**Development mode with watch:**
```bash
npm run dev
```

### Claude Desktop Integration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/absolute/path/to/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "AZURE_TENANT_ID": "your-tenant-id",
        "AZURE_CLIENT_ID": "your-client-id",
        "AZURE_CLIENT_SECRET": "your-client-secret",
        "IMAGE_OUTPUT_DIR": "/path/to/output/images"
      }
    }
  }
}
```

### Using the Image Generation Tool

Once connected, you can ask Claude to generate images:

```
Generate an image of a serene mountain landscape at sunset with a lake in the foreground
```

Claude will use the `generate_image` tool with appropriate parameters.

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
1. Verify Azure credentials are set correctly
2. Ensure service principal/managed identity has `Cognitive Services OpenAI User` role
3. Check that the role is assigned to the correct Azure OpenAI resource
4. For local development, verify all three values are set: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`

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
2. **Use managed identity in production**: Avoid storing client secrets in production environments
3. **Rotate credentials regularly**: Rotate service principal secrets used in dev/CI
4. **Store secrets securely**: Use Azure Key Vault or similar for secret management
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
