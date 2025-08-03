import { createHonoAdapter } from '../adapters/hono.js';

const app = createHonoAdapter();

export default {
  fetch: app.fetch,
};