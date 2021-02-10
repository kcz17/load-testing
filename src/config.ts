const HOST = __ENV.K6_HOST ?? "localhost";
const PORT = __ENV.K6_PORT ?? 80;
export const BASE_URL = `http://${HOST}:${PORT}/`;
