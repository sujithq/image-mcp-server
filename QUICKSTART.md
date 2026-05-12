# Quick Start Guide

This guide will help you get the Azure Image MCP Server up and running in just a few minutes.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 18 or higher installed
- [ ] An Azure subscription
- [ ] Azure OpenAI resource with deployed image models
- [ ] Signed-in Azure CLI user or managed identity with appropriate RBAC permissions

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

**For local development (Azure CLI identity):**

```bash
# Sign in with the account that will run the MCP server
az login

# Assign RBAC access to that signed-in user
az role assignment create \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --role "Cognitive Services OpenAI User" \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.CognitiveServices/accounts/{openai-resource-name}
```

The server uses `DefaultAzureCredential`, so local development can authenticate through Azure CLI without storing a client secret.

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

# Authentication uses DefaultAzureCredential with Azure RBAC.
# For local development, run `az login` before starting the server.
# For Azure-hosted user-assigned managed identity, optionally set AZURE_CLIENT_ID.
# AZURE_CLIENT_ID=your-managed-identity-client-id

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

## Step 4: Integrate with VS Code

### Install an MCP-Compatible Extension

Choose one of the following VS Code extensions that support MCP:

1. **Cline** (Recommended for beginners)
   - Install from: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)
   - Best for: General AI assistance with MCP support

2. **Claude Code** (Official Anthropic extension)
   - Install from: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code)
   - Best for: Professional development with Claude AI

3. **Continue**
   - Install from: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Continue.continue)
   - Best for: Multi-model AI coding assistance

### Configure the MCP Server

#### For Cline Extension:

1. Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Search for "Preferences: Open User Settings (JSON)"
3. Add the following configuration:

```json
{
  "cline.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/absolute/path/to/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "IMAGE_OUTPUT_DIR": "/absolute/path/to/generated-images"
      }
    }
  }
}
```

#### For Claude Code Extension:

Create or edit `.vscode/settings.json` in your workspace:

```json
{
  "claude-code.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["${workspaceFolder}/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "IMAGE_OUTPUT_DIR": "${workspaceFolder}/generated-images"
      }
    }
  }
}
```

**Pro tip:** Use `az login` for local development, then keep MCP configuration free of credentials.

#### For Continue Extension:

Edit `~/.continue/config.json`:

```json
{
  "mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/absolute/path/to/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "IMAGE_OUTPUT_DIR": "/absolute/path/to/generated-images"
      }
    }
  }
}
```

### Reload VS Code

1. Close and reopen VS Code, or
2. Use Command Palette: "Developer: Reload Window"

### Verify Connection

1. Open the extension's panel (e.g., Cline icon in sidebar)
2. Look for "MCP Tools" or "Available Tools" section
3. You should see `generate_image` tool listed

## Step 5: Generate Your First Image

In your VS Code AI assistant, try:

```
Generate an image of a futuristic city at night with flying cars and neon lights
```

The AI will use the `generate_image` tool and return the path to the generated image.

## Troubleshooting

### Authentication Errors

**Error:** `Authentication failed` or `401/403`

**Solution:**
1. Run `az login` locally, or verify managed identity is enabled on the Azure host
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

### VS Code Extension Not Detecting Server

**Solution:**
1. Ensure absolute paths are used in config (or proper workspace variables)
2. Verify `npm run build` completed successfully
3. Check extension output logs:
   - Open Output panel (`Ctrl+Shift+U` or `Cmd+Shift+U`)
   - Select your extension from dropdown (e.g., "Cline", "Claude Code")
4. Reload VS Code window
5. Check MCP server is running with `LOG_LEVEL=debug` for detailed logs

### Extension-Specific Issues

**Cline:** Check settings under "Cline: MCP Settings" in VS Code settings
**Claude Code:** Verify workspace `.vscode/settings.json` is correctly formatted
**Continue:** Check `~/.continue/config.json` syntax is valid JSON

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore advanced configuration options
- Check out the [test client](test-client.js) for API examples
- Review logs in `IMAGE_OUTPUT_DIR` for debugging
- Try generating images with different parameters (size, quality, style)

## Getting Help

- Check logs with `LOG_LEVEL=debug` for more details
- Review Azure OpenAI service health
- Verify quota limits in Azure Portal
- Check extension-specific documentation
- Check GitHub Issues for known problems
