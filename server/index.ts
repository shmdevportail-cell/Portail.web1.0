import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSendRegistrationWhatsApp, handleIncomingIdea } from "./routes/whatsapp";
import { handleRegister, handleLogin, handleGetProfile, handleSavePdfQrCode } from "./routes/auth";
import { handleSendIdeaNotification, handleGetIdeas } from "./routes/ideas";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Debug endpoint - check environment variables
  app.get("/api/debug/env", (_req, res) => {
    console.log("=== ENVIRONMENT VARIABLES CHECK ===");
    const env = {
      supabase: {
        url: !!process.env.SUPABASE_URL,
        anonKey: !!process.env.SUPABASE_ANON_KEY,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      twilio: {
        accountSid: !!process.env.TWILIO_ACCOUNT_SID,
        authToken: !!process.env.TWILIO_AUTH_TOKEN,
        phoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
        adminWhatsApp: !!process.env.ADMIN_WHATSAPP,
      },
      ping: !!process.env.PING_MESSAGE,
      nodeEnv: process.env.NODE_ENV,
    };
    console.log(JSON.stringify(env, null, 2));
    res.json(env);
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/profile", handleGetProfile);
  app.post("/api/auth/save-documents", handleSavePdfQrCode);

  // WhatsApp routes
  app.post("/api/whatsapp/send-registration", handleSendRegistrationWhatsApp);
  app.get("/api/whatsapp/incoming-idea", (_req, res) => {
    // Twilio webhook validation (GET request)
    res.status(200).send("✓ Webhook is accessible");
  });
  app.post("/api/whatsapp/incoming-idea", handleIncomingIdea);

  // Test endpoint to verify webhook
  app.post("/api/whatsapp/test", (_req, res) => {
    console.log("✓ Test webhook called - endpoint is working!");
    res.json({ success: true, message: "Webhook endpoint is working correctly" });
  });

  // Ideas routes
  app.get("/api/ideas", handleGetIdeas);
  app.post("/api/ideas/send-notification", handleSendIdeaNotification);

  return app;
}
