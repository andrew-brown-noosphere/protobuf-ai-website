# Natural Language Schema Generation

protobuf.ai can generate complete Protocol Buffers schemas from natural language descriptions using AI.

## Quick Start

```bash
# Install dependencies
npm install

# Run the demo
npm run demo

# Use the CLI
npm run cli create "user authentication service with OAuth support"
```

## Features

### 🤖 AI-Powered Generation
Describe what you want in plain English and get production-ready protobuf schemas:

```bash
protobuf-ai create "e-commerce order management system with inventory tracking"
```

### ✅ Built-in Validation
Automatically includes `protovalidate` rules for data validation:
- Email validation
- UUID format checking  
- String length constraints
- Numeric ranges

### 🔧 gRPC Ready
Generated schemas include complete service definitions with:
- CRUD operations
- Streaming RPCs where appropriate
- Pagination patterns
- Error handling

### 📚 Best Practices
Follows Google's protobuf style guide:
- Proper naming conventions
- Well-known types usage
- Versioning patterns
- Clear documentation

## Examples

### User Authentication Service
```bash
protobuf-ai create "user authentication service with email and password login"
```

Generates:
- User message with validation
- Login/Register/Logout RPCs
- Token management
- Password security best practices

### Payment Processing
```bash
protobuf-ai create "payment processing service with stripe integration"
```

Generates:
- Payment message with status tracking
- Stripe webhook handling
- Idempotency support
- Currency handling

### Real-time Chat
```bash
protobuf-ai create "real-time chat messaging service"
```

Generates:
- Message/Room/User models
- Streaming message delivery
- Presence tracking
- Message history

## CLI Commands

### Create Schema
```bash
protobuf-ai create <description> [options]

Options:
  -o, --output <file>     Save to file instead of stdout
  --no-validation         Disable protovalidate rules
  --no-grpc              Disable gRPC service generation
  -s, --style <style>     Schema style: minimal, detailed, enterprise
```

### Improve Existing Schema
```bash
protobuf-ai improve <file> <requirements>

Example:
protobuf-ai improve user.proto "add OAuth support and user profiles"
```

### Validate Schema
```bash
protobuf-ai validate <file>
```

## Integration with MCP

The natural language generator is integrated into the MCP server:

```typescript
// In your MCP client
const result = await client.callTool('ai-create-schema', {
  description: 'user authentication service',
  includeValidation: true,
  targetPlatforms: ['go', 'typescript']
});
```

## Architecture

```
User Input → Natural Language Processing → Schema Generation → Validation → Output
     ↓                    ↓                        ↓                ↓
 "auth service"    Extract intent          Generate proto    Check syntax
                   Identify patterns       Apply templates    Add validation
                   Infer operations        Follow style      Optimize
```

## API Usage

```typescript
import { AIEngine } from '@protobuf-ai/core';

const ai = new AIEngine();

// Generate from description
const schema = await ai.generateSchema(
  'payment processing service',
  {
    includeValidation: true,
    includeGrpc: true,
    style: 'enterprise'
  }
);

console.log(schema.raw);
```

## Customization

### Styles

- **minimal**: Basic schema with essential fields only
- **detailed**: Comprehensive schema with common patterns (default)
- **enterprise**: Full-featured with audit trails, multi-tenancy

### Target Platforms

Optimize generated schemas for specific platforms:
- `go` - Go-specific optimizations
- `typescript` - TypeScript/JavaScript friendly
- `python` - Python conventions
- `java` - Java patterns

## Limitations

- Requires Anthropic API key (set `ANTHROPIC_API_KEY`)
- Generated schemas should be reviewed before production use
- Complex domain logic may require manual refinement

## Future Enhancements

- [ ] Learn from existing schemas in your codebase
- [ ] Generate migration paths between schema versions
- [ ] Multi-file schema generation for large systems
- [ ] Integration with schema registries
- [ ] Real-time collaboration features