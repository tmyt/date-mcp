import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { StreamableHTTPTransport } from '@hono/mcp';
import { createDateMcpServer } from '../mcp/server.js';

export function createHonoAdapter(): Hono {
  const app = new Hono();
  
  // Enable CORS for cross-origin requests
  app.use('/*', cors());
  
  // MCP endpoint - handles all HTTP methods
  // Path format: /:area/:location (e.g., /Asia/Tokyo, /America/New_York)
  app.all('/:area/:location', async (c) => {
    const { area, location } = c.req.param();
    
    // Construct timezone from path parameters
    const timezone = `${area}/${location}`;
    
    // Create server instance for this request
    const server = createDateMcpServer(timezone);
    
    // Create transport and handle request
    const transport = new StreamableHTTPTransport();
    await server.connect(transport);
    
    return transport.handleRequest(c);
  });
  
  return app;
}
