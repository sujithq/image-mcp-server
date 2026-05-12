# Quick Start Guide

This guide will help you get the Azure Image MCP Server up and running in just a few minutes.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18 or higher installed
- [ ] An Azure subscription
- [ ] Azure OpenAI resource with deployed image models
- [ ] Service principal or managed identity with appropriate permissions

## Step 1: Azure Setup

### Create Azure OpenAI Resource

```bash
# Create resource group
az group create --name my-openai-rg --location eastus

# Create Azure OpenAI resource
az cognitiveservices account create \
  --name my-openai-resource \
  --resource-group my-openai-rg \
  --kind OpenAI \
  --sku S0 \
  --location eastus
```

### Deploy Image Models

1. Go to Azure OpenAI Studio: https://oai.azure.com/
2. Navigate to "Deployments"
3. Click "Create new deployment"
4. Select model: `dall-e-3` (for gpt-image-2) or `dall-e-2` (for gpt-image-1.5)
5. Give it a deployment name (e.g., `gpt-image-2`)
6. Click "Create"

### Set Up Authentication

**For local development (Service Principal):**

```bash
# Create service principal
az ad sp create-for-rbac --name azure-image-mcp-sp \
  --role "Cognitive Services OpenAI User" \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.CognitiveServices/accounts/{openai-resource-name}
```

Save the output values:
- `appId` → `AZURE_CLIENT_ID`
- `password` → `AZURE_CLIENT_SECRET`
- `tenant` → `AZURE_TENANT_ID`

**For Azure-hosted runtime (Managed Identity):**

```bash
# Enable managed identity (for App Service example)
az webapp identity assign \
  --name my-app \
  --resource-group my-rg

# Assign role to Azure OpenAI resource
az role assignment create \
  --assignee {managed-identity-principal-id} \
  --role "Cognitive Services OpenAI User" \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.CognitiveServices/accounts/{openai-resource-name}
```

## Step 2: Install and Configure

### Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd azure-image-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required values:**
```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_IMAGE_MODEL=gpt-image-2
AZURE_OPENAI_IMAGE_FALLBACK_MODEL=gpt-image-1.5

# For local development only
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

IMAGE_OUTPUT_DIR=./output/images
MCP_TRANSPORT_MODE=stdio
LOG_LEVEL=info
```

## Step 3: Test the Server

### Verify Build and Tests

```bash
# Run type checking
npm run typecheck

# Run tests
npm test

# Run linting
npm run lint
```

### Run the Server

```bash
# Start the server
npm start
```

You should see log output like:
```json
{"timestamp":"2024-05-12T10:00:00.000Z","level":"info","message":"Azure Image Service initialized","endpoint":"https://..."}
{"timestamp":"2024-05-12T10:00:00.000Z","level":"info","message":"Azure credentials verified successfully"}
{"timestamp":"2024-05-12T10:00:00.000Z","level":"info","message":"Azure Image MCP Server running on stdio"}
```

## Step 4: Integrate with Claude Desktop

### macOS Configuration

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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
        "IMAGE_OUTPUT_DIR": "/Users/yourname/generated-images"
      }
    }
  }
}
```

### Windows Configuration

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["C:\\path\\to\\azure-image-mcp-server\\dist\\index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "AZURE_TENANT_ID": "your-tenant-id",
        "AZURE_CLIENT_ID": "your-client-id",
        "AZURE_CLIENT_SECRET": "your-client-secret",
        "IMAGE_OUTPUT_DIR": "C:\\Users\\YourName\\generated-images"
      }
    }
  }
}
```

### Restart Claude Desktop

1. Quit Claude Desktop completely
2. Start Claude Desktop
3. Look for the tools icon (🔧) in the chat interface
4. The `generate_image` tool should be available

## Step 5: Generate Your First Image

In Claude Desktop, try:

```
Generate an image of a futuristic city at night with flying cars and neon lights
```

Claude will use the `generate_image` tool and return the path to the generated image.

## Troubleshooting

### Authentication Errors

**Error:** `Authentication failed` or `401/403`

**Solution:**
1. Verify service principal credentials are correct
2. Check role assignment: `Cognitive Services OpenAI User`
3. Ensure resource scope is correct
4. Try getting a token manually:
   ```bash
   az account get-access-token --resource https://cognitiveservices.azure.com/
   ```

### Model Not Found

**Error:** `Model not found` or `deployment not found`

**Solution:**
1. Verify deployment names in Azure Portal
2. Ensure `AZURE_OPENAI_IMAGE_MODEL` matches deployment name exactly
3. Check model is deployed and not disabled

### Images Not Saving

**Error:** Images not appearing in output directory

**Solution:**
1. Check `IMAGE_OUTPUT_DIR` exists and is writable
2. Use absolute paths in configuration
3. Check server logs for file system errors

### Claude Desktop Not Detecting Server

**Solution:**
1. Ensure absolute paths are used in config
2. Verify `npm run build` completed successfully
3. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`
4. Restart Claude Desktop

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore advanced configuration options
- Check out the [test client](test-client.js) for API examples
- Review logs in `IMAGE_OUTPUT_DIR` for debugging

## Getting Help

- Check logs with `LOG_LEVEL=debug` for more details
- Review Azure OpenAI service health
- Verify quota limits in Azure Portal
- Check GitHub Issues for known problems
