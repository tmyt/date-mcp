#!/usr/bin/env node
import { runStdioAdapter } from '../adapters/stdio.js';

// Start server with stdio transport if running as CLI
runStdioAdapter().catch(console.error);
