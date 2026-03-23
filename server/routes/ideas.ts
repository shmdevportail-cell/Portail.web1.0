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
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const adminWhatsApp = process.env.ADMIN_WHATSAPP;

    // Vérifier que Twilio est configuré
    if (!accountSid || !authToken || !fromNumber || !adminWhatsApp) {
      console.warn("Twilio non configuré - notification non envoyée");
      return res.status(200).json({
        success: false,
        message: "Service Twilio non disponible",
      });
    }

    const {
      ideaTitle,
      ideaDescription,
      phoneNumber,
      budget,
      requirements,
      authorName
    } = req.body;

    // Validation basique
    if (!ideaTitle || !ideaDescription || !phoneNumber) {
      return res.status(400).json({
        error: "ideaTitle, ideaDescription et phoneNumber sont requis",
      });
    }

    // Composer le message WhatsApp
    const message = `
💡 *NOUVELLE IDÉE REÇUE* 💡

📌 *Titre:* ${ideaTitle}

📝 *Description:*
${ideaDescription}

👤 *Auteur:* ${authorName || "Anonyme"}

📱 *Téléphone:* ${phoneNumber}

${budget ? `💰 *Budgét proposé:* ${budget} DH` : ""}

${requirements ? `🔧 *Ressources nécessaires:*
${requirements}` : ""}

⏰ *Date/Heure:* ${new Date().toLocaleString("fr-MA")}
    `.trim();

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

    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio error:", error);
      return res.status(500).json({ error: "Failed to send WhatsApp message" });
    }

    const data = await response.json();
    console.log(`✓ Message Twilio envoyé: ${(data as any).sid}`);

    res.json({
      success: true,
      message: "Notification WhatsApp envoyée à l'admin",
      messageSid: (data as any).sid,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi Twilio:", error);
    res.status(500).json({
      error: "Erreur lors de l'envoi de la notification",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
