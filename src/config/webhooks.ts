export const WEBHOOK_CONFIG = {
  // n8n base URL — configured via environment variable
  N8N_BASE_URL: ((import.meta as any).env?.VITE_N8N_WEBHOOK_URL || 'https://yi7a1c8g.rpcld.co/webhook/b44613c6-4148-4497-b1fe-298d6d84060d'),

  // Endpoints relative to base URL
  ENDPOINTS: {
    // Create Zalo group when project is created
    CREATE_PROJECT_GROUP: '/webhook/create-zalo-group',

    // Send notification to existing Zalo group
    SEND_NOTIFICATION: '/webhook/send-zalo-notification',
  },

  // Request timeout in milliseconds
  TIMEOUT: 15000,
}
