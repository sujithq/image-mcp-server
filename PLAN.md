## Plan: MCP Image Generation Server
Build a new MCP server from scratch that exposes image-generation tools backed by Azure OpenAI image models in Microsoft Foundry. Use gpt-image-2 as the default for highest-fidelity, detailed outputs, and include a model override/fallback to gpt-image-1.5 for better latency/cost tradeoffs and compatibility. Implement both stdio and SSE transports in the same service so local and remote clients are supported.

**Steps**
1. Phase 1 - Scaffold and configuration.
2. Initialize a TypeScript Node.js MCP server project with strict TypeScript settings, linting, and environment-based configuration for endpoint, keyless Microsoft Entra ID authentication (managed identity/service principal), deployment/model name, and output directory.
3. Add a transport abstraction so startup can run stdio, SSE, or both based on config flags. Keep transport bootstrap isolated from tool logic.
4. Phase 2 - Image tool implementation (depends on Phase 1).
5. Implement a primary MCP tool for text-to-image generation with required prompt input and optional parameters: size, quality, n, output_format, output_compression, background, and user identifier.
6. Integrate Azure OpenAI image generation endpoint using the deployed image model. Decode base64 payloads and persist images locally with deterministic filenames plus metadata sidecar (prompt, model, size, quality, timestamp, request id if available).
7. Return MCP tool output as structured JSON containing file paths, mime type, dimensions/parameters used, and any warnings.
8. Add a model selection strategy: default gpt-image-2, optional per-request override, and fallback to gpt-image-1.5 for retry on model-specific availability or quota constraints.
9. Phase 3 - Reliability and safety (depends on Phase 2).
10. Add robust error mapping for authentication, quota/rate limit (429), content filter rejections, timeout handling, and partial retry policy with capped backoff.
11. Add input validation for prompt length and allowed option ranges; reject invalid combinations early with actionable error messages.
12. Add lightweight observability: structured logs for request lifecycle, model used, latency, and error code categories.
13. Phase 4 - Verification and developer UX (parallel with parts of Phase 3 once tool shape is stable).
14. Add unit tests for request validation, response parsing/base64 decode, and fallback/model routing behavior.
15. Add an integration smoke test that calls the tool with a known prompt and verifies image file creation and metadata outputs.
16. Provide run scripts and a minimal README for local setup, auth, model deployment naming, and examples for both stdio and SSE clients.

**Relevant files**
- New project root files for TypeScript/Node package setup, lint/test configs, and environment sample.
- New server bootstrap module for MCP server registration and dual transport startup.
- New image generation service module for Azure OpenAI API calls, response parsing, file persistence, and fallback logic.
- New tool-definition module for MCP input schema, validation, and structured outputs.
- New tests directory for unit and integration coverage.
- New docs/README content for provisioning requirements and run instructions.

**Verification**
1. Run lint and typecheck to confirm build health.
2. Run unit tests for validation and fallback logic.
3. Run integration smoke test against a deployed Foundry image model and verify at least one generated image file plus metadata output.
4. Manual test from an MCP client over stdio and SSE to confirm both transports register the same tool and produce identical structured responses.
5. Negative tests: invalid params, rate-limit simulation, and content-filtered prompt handling.

**Decisions**
- Recommended default model: gpt-image-2 for best detail and highest-fidelity output (including broader resolution/aspect-ratio support up to 4K).
- Fallback model: gpt-image-1.5 for improved efficiency/latency with strong realism and instruction following.
- Scope included: text-to-image generation end-to-end, both stdio and SSE transports, resilient error handling, and baseline tests.
- Scope excluded (initial version): image edit/inpainting, streaming partial images, custom auth brokering beyond standard Entra ID credential flows, and production infra/deployment automation.

**Further Considerations**
1. Authentication mode recommendation: use Microsoft Entra ID keyless auth from the start (managed identity in Azure, service principal for local dev/CI).
2. Output storage recommendation: local filesystem first; optional blob storage adapter can be added as Phase 2 enhancement.
3. Throughput recommendation: begin with single-request processing; add queue/concurrency controls after baseline behavior is verified.

**Entra ID Checklist**
1. Azure resource prerequisites:
- Create or select an Azure OpenAI resource in a supported region.
- Deploy gpt-image-2 (primary) and optionally gpt-image-1.5 (fallback) with known deployment names.
2. Identity and access prerequisites:
- For local dev/CI, create a service principal (app registration) in the same tenant as the Azure OpenAI resource.
- For Azure-hosted runtime, enable a managed identity on the host (App Service, Container Apps, VM, or Functions).
- Assign Cognitive Services OpenAI User role on the Azure OpenAI resource to the service principal and/or managed identity.
3. Local environment variables for keyless auth:
- AZURE_OPENAI_ENDPOINT: Azure OpenAI endpoint URL.
- AZURE_OPENAI_IMAGE_MODEL: primary deployment name (for example gpt-image-2 deployment alias).
- AZURE_OPENAI_IMAGE_FALLBACK_MODEL: optional fallback deployment name.
- AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET: required for local service principal auth.
- IMAGE_OUTPUT_DIR and MCP transport mode variables (stdio, sse, or both).
4. Token flow implementation requirements:
- Use DefaultAzureCredential with scope https://ai.azure.com/.default.
- Fail fast with clear diagnostics if credential chain fails.
- Log which credential source succeeded (service principal vs managed identity) without exposing secrets.
5. Auth verification sequence:
- Run a startup health check that acquires a token before registering MCP tools.
- Execute one low-cost test generation prompt and confirm successful image file write.
- Validate unauthorized path by temporarily removing role assignment and confirming explicit 401/403 handling.
6. Production hardening requirements:
- Prefer managed identity in production; avoid storing client secrets in production runtime.
- Rotate service principal secrets used in dev/CI and store them in secure secret stores.
- Add alerting for repeated auth failures and token acquisition errors.