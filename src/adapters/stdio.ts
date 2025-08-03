import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createDateMcpServer } from '../mcp/server.js';

export async function runStdioAdapter(): Promise<void> {
  // Get system timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create server instance
  const server = createDateMcpServer(timezone);
  
  // Create and connect stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
