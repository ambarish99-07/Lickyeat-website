import "dotenv/config";

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  port: Number(process.env.PORT ?? 4100),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  mongoUri: optional("MONGODB_URI"),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:3100")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  razorpay: {
    keyId: optional("RAZORPAY_KEY_ID"),
    keySecret: optional("RAZORPAY_KEY_SECRET"),
    get configured() {
      return Boolean(this.keyId && this.keySecret);
    },
  },
  whatsapp: {
    token: optional("WHATSAPP_TOKEN"),
    phoneId: optional("WHATSAPP_PHONE_ID"),
    get configured() {
      return Boolean(this.token && this.phoneId);
    },
  },
  /** Public-facing Lickyeat WhatsApp number for wa.me deep links + the ops fallback alert. */
  contact: {
    /** digits only, country code included, e.g. 919000000000 */
    whatsappNumber: optional("LICKYEAT_WHATSAPP_NUMBER"),
    supportEmail: optional("LICKYEAT_SUPPORT_EMAIL"),
  },
  /** Where new-lead / callback alerts go when the admin panel is offline. */
  opsNotify: {
    email: optional("OPS_NOTIFY_EMAIL"),
    whatsappNumber: optional("OPS_NOTIFY_WHATSAPP"),
    /** generic webhook (Zapier / Make / n8n / Slack incoming-webhook). */
    webhookUrl: optional("OPS_NOTIFY_WEBHOOK_URL"),
    /** Resend HTTP API key — the no-SMTP way to actually send the email. */
    resendApiKey: optional("RESEND_API_KEY"),
  },
};
