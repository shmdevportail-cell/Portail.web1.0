import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Fetch all ideas from WhatsApp
 * GET /api/ideas
 */
export const handleGetIdeas: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ideas:", error);
      return res.status(500).json({ error: "Failed to fetch ideas" });
    }

    res.json({ success: true, ideas: data || [] });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Envoyer une notification WhatsApp quand une idée est soumise
 * POST /api/ideas/send-notification
 */
export const handleSendIdeaNotification: RequestHandler = async (req, res) => {
  try {
    console.log("\n=== IDEA SUBMISSION RECEIVED ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const adminWhatsApp = process.env.ADMIN_WHATSAPP;

    console.log("\n=== TWILIO CONFIG CHECK ===");
    console.log(`Account SID: ${accountSid ? "✓ SET" : "✗ MISSING"}`);
    console.log(`Auth Token: ${authToken ? "✓ SET" : "✗ MISSING"}`);
    console.log(`From Number: ${fromNumber || "✗ MISSING"}`);
    console.log(`Admin WhatsApp: ${adminWhatsApp || "✗ MISSING"}`);

    // Vérifier que Twilio est configuré
    if (!accountSid || !authToken || !fromNumber || !adminWhatsApp) {
      console.error("❌ Twilio configuration incomplete!");
      return res.status(400).json({
        success: false,
        error: "Twilio configuration missing",
        missing: {
          accountSid: !accountSid,
          authToken: !authToken,
          fromNumber: !fromNumber,
          adminWhatsApp: !adminWhatsApp,
        }
      });
    }

    const {
      ideaTitle,
      ideaDescription,
      budget,
      requirements,
      authorName
    } = req.body;

    // Validation basique
    if (!ideaTitle || !ideaDescription) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        error: "ideaTitle et ideaDescription sont requis",
      });
    }

    // Composer le message WhatsApp
    const message = `💡 *NOUVELLE IDÉE REÇUE* 💡

📌 *Titre:* ${ideaTitle}

📝 *Description:*
${ideaDescription}

👤 *Auteur:* ${authorName || "Anonyme"}

${budget ? `💰 *Budgét proposé:* ${budget} DH` : ""}

${requirements ? `🔧 *Ressources nécessaires:*
${requirements}` : ""}

⏰ *Date/Heure:* ${new Date().toLocaleString("fr-MA")}`;

    console.log("\n=== SENDING MESSAGE ===");
    console.log(`From: ${fromNumber}`);
    console.log(`To: ${adminWhatsApp}`);
    console.log(`Message length: ${message.length} chars`);
    console.log("Message preview:", message.substring(0, 100) + "...");

    // Envoyer via Twilio REST API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString(
            "base64"
          )}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: adminWhatsApp,
          Body: message,
        }).toString(),
      }
    );

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Twilio error:", errorText);
      return res.status(response.status).json({
        success: false,
        error: "Failed to send WhatsApp message",
        twilioError: errorText,
      });
    }

    const data = await response.json();
    console.log(`✓ Message sent successfully! SID: ${(data as any).sid}`);

    res.json({
      success: true,
      message: "Notification WhatsApp envoyée à l'admin",
      messageSid: (data as any).sid,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi Twilio:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la notification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
