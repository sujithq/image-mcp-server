# VS Code Setup Guide

This guide provides detailed instructions for integrating the Azure Image MCP Server with VS Code using various MCP-compatible extensions.

## Prerequisites

Before you begin, ensure you have:

- VS Code installed (version 1.75 or later)
- Azure Image MCP Server built and ready (`npm run build` completed)
- Azure OpenAI credentials configured
- Node.js 18+ installed

## Supported VS Code Extensions

### 1. Cline (Recommended for Beginners)

**Why choose Cline:**
- Easy to set up
- Good documentation
- Active community support
- Built-in MCP support

**Installation:**
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Cline"
4. Click Install on "Cline" by Saoud Rizwan
5. Or install directly: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev)

**Configuration:**
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "Preferences: Open User Settings (JSON)"
3. Add this configuration:

```json
{
  "cline.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/absolute/path/to/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "AZURE_TENANT_ID": "your-tenant-id",
        "AZURE_CLIENT_ID": "your-client-id",
        "AZURE_CLIENT_SECRET": "your-client-secret",
        "IMAGE_OUTPUT_DIR": "/absolute/path/to/output"
      }
    }
  }
}
```

**Usage:**
1. Click the Cline icon in the sidebar
2. Start a new conversation
3. Ask: "Generate an image of a mountain landscape"
4. Cline will use the MCP server to generate the image

---

### 2. Claude Code (Official Anthropic Extension)

**Why choose Claude Code:**
- Official Anthropic extension
- Professional-grade features
- Excellent VS Code integration
- Regular updates

**Installation:**
1. Open Extensions in VS Code
2. Search for "Claude Code"
3. Install "Claude Code" by Anthropic
4. Or install from: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code)

**Configuration (Workspace):**

Create `.vscode/settings.json` in your project:

```json
{
  "claude-code.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["${workspaceFolder}/azure-image-mcp-server/dist/index.js"],
      "env": {
        "AZURE_OPENAI_ENDPOINT": "https://your-resource.openai.azure.com/",
        "AZURE_OPENAI_IMAGE_MODEL": "gpt-image-2",
        "AZURE_TENANT_ID": "${env:AZURE_TENANT_ID}",
        "AZURE_CLIENT_ID": "${env:AZURE_CLIENT_ID}",
        "AZURE_CLIENT_SECRET": "${env:AZURE_CLIENT_SECRET}",
        "IMAGE_OUTPUT_DIR": "${workspaceFolder}/output/images"
      }
    }
  }
}
```

**Security Note:** Use `${env:VAR_NAME}` to reference system environment variables instead of hardcoding credentials.

**Usage:**
1. Open Claude Code panel
2. Select the azure-image MCP server from available tools
3. Generate images through natural language requests

---

### 3. Continue

**Why choose Continue:**
- Multi-model support (Claude, GPT-4, etc.)
- Extensive customization options
- Great for teams using different AI models
- MCP support

**Installation:**
1. Open Extensions in VS Code
2. Search for "Continue"
3. Install "Continue" extension
4. Or install from: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Continue.continue)

**Configuration:**

Edit `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-anthropic-api-key"
    }
  ],
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
        "IMAGE_OUTPUT_DIR": "/absolute/path/to/output"
      }
    }
  }
}
```

**Usage:**
1. Open Continue panel in sidebar
2. Type your request: "Generate an image of..."
3. Continue will use the MCP server to handle image generation

---

## Environment Variables Best Practices

### Option 1: System Environment Variables (Recommended)

Set environment variables at the system level:

**Linux/macOS:**
```bash
export AZURE_TENANT_ID="your-tenant-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
```

Add to `~/.bashrc` or `~/.zshrc` for persistence.

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('AZURE_TENANT_ID', 'your-tenant-id', 'User')
[System.Environment]::SetEnvironmentVariable('AZURE_CLIENT_ID', 'your-client-id', 'User')
[System.Environment]::SetEnvironmentVariable('AZURE_CLIENT_SECRET', 'your-client-secret', 'User')
```

Then reference in VS Code settings:
```json
"env": {
  "AZURE_TENANT_ID": "${env:AZURE_TENANT_ID}",
  "AZURE_CLIENT_ID": "${env:AZURE_CLIENT_ID}",
  "AZURE_CLIENT_SECRET": "${env:AZURE_CLIENT_SECRET}"
}
```

### Option 2: VS Code Workspace Variables

Use workspace-specific environment files:

1. Create `.vscode/settings.json`
2. Add MCP configuration with `${env:VAR}` syntax
3. Set environment variables in your terminal before launching VS Code
4. Or use VS Code's integrated terminal with environment variables

### Option 3: Azure Key Vault (Production)

For production deployments:
1. Store secrets in Azure Key Vault
2. Use managed identity for authentication
3. Reference Key Vault secrets in your environment configuration

---

## Troubleshooting

### Extension Not Finding MCP Server

**Problem:** Extension doesn't detect the MCP server

**Solutions:**
1. Verify the path to `dist/index.js` is absolute
2. Check that `npm run build` completed successfully
3. Reload VS Code window: Command Palette → "Developer: Reload Window"
4. Check extension output logs for errors

### Checking Extension Logs

**Cline:**
- Open Output panel: `View` → `Output`
- Select "Cline" from dropdown

**Claude Code:**
- Open Output panel
- Select "Claude Code" from dropdown

**Continue:**
- Open Output panel
- Select "Continue" from dropdown

### MCP Server Not Starting

**Problem:** Server fails to start or crashes immediately

**Solutions:**
1. Check server logs: Set `LOG_LEVEL=debug` in environment
2. Verify Node.js version: `node --version` (must be 18+)
3. Test server manually: `node dist/index.js`
4. Check for missing dependencies: `npm install`

### Authentication Failures

**Problem:** "Authentication failed" or "401/403" errors

**Solutions:**
1. Verify Azure credentials are correct
2. Check environment variables are properly set
3. Ensure service principal has correct role: "Cognitive Services OpenAI User"
4. Test credentials: `az account get-access-token --resource https://cognitiveservices.azure.com/`

### Images Not Generating

**Problem:** MCP server runs but images fail to generate

**Solutions:**
1. Check `IMAGE_OUTPUT_DIR` exists and is writable
2. Verify Azure OpenAI deployment name matches `AZURE_OPENAI_IMAGE_MODEL`
3. Check Azure OpenAI quota hasn't been exceeded
4. Review server logs for detailed error messages

---

## Testing Your Setup

### Quick Test

1. Open VS Code with your extension installed
2. Open the extension's chat/panel
3. Type: "Generate an image of a sunset over mountains"
4. Wait for the response with image file path
5. Open the generated image from the path provided

### Verify Tool Registration

Most extensions show available MCP tools:

**Cline:** Look for "MCP Tools" section in the panel
**Claude Code:** Check "Available Tools" in settings
**Continue:** View tools in the Continue configuration UI

You should see `generate_image` tool listed.

---

## Advanced Configuration

### Multiple MCP Servers

You can configure multiple MCP servers:

```json
{
  "cline.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["/path/to/azure-image-mcp-server/dist/index.js"],
      "env": { /* ... */ }
    },
    "another-server": {
      "command": "node",
      "args": ["/path/to/another-server/index.js"],
      "env": { /* ... */ }
    }
  }
}
```

### Workspace-Specific Configuration

Create `.vscode/settings.json` in each project for project-specific settings:

```json
{
  "claude-code.mcpServers": {
    "azure-image": {
      "command": "node",
      "args": ["${workspaceFolder}/tools/azure-image-mcp-server/dist/index.js"],
      "env": {
        "IMAGE_OUTPUT_DIR": "${workspaceFolder}/generated-images"
      }
    }
  }
}
```

### Custom Output Directories

Use VS Code variables for dynamic paths:

- `${workspaceFolder}` - Current workspace root
- `${workspaceFolderBasename}` - Workspace folder name
- `${file}` - Current opened file
- `${fileBasename}` - Current file name
- `${env:VAR}` - Environment variable

---

## Security Recommendations

1. **Never commit credentials** to version control
2. **Use environment variables** for secrets
3. **Consider Azure Key Vault** for production
4. **Use managed identity** when running on Azure
5. **Rotate credentials** regularly
6. **Monitor usage** in Azure Portal
7. **Set up alerts** for unusual activity

---

## Getting Help

- **Extension Issues:** Check extension's GitHub repository
- **MCP Server Issues:** Check server logs with `LOG_LEVEL=debug`
- **Azure Issues:** Review Azure OpenAI service health
- **General Help:** See [README.md](README.md) and [QUICKSTART.md](QUICKSTART.md)

## Next Steps

- Experiment with different image prompts
- Try different image sizes and qualities
- Set up custom output directories
- Explore other MCP servers
- Share your setup with your team
