// Supabase Edge Function: RevenueCat Webhook Handler
// Deno TypeScript runtime

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface RevenueCatEvent {
  event: {
    type: string;
    app_user_id: string; // Supabase user ID
    entitlement_ids?: string[];
    entitlement_id?: string;
    expiration_at_ms?: number;
    purchased_at_ms?: number;
    product_id?: string;
  };
}

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 1. Verify Secret Header
  const authHeader = req.headers.get("Authorization");
  if (REVENUECAT_WEBHOOK_SECRET && authHeader !== REVENUECAT_WEBHOOK_SECRET && authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
    console.error("Unauthorized webhook call: Invalid secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const payload: RevenueCatEvent = await req.json();
    const { event } = payload;

    if (!event || !event.app_user_id) {
      return new Response(JSON.stringify({ error: "Missing event payload or app_user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userId = event.app_user_id;
    const eventType = event.type;
    const entitlementIds = event.entitlement_ids || (event.entitlement_id ? [event.entitlement_id] : []);
    const isOrganizerProEntitlement = entitlementIds.includes("organizer_pro");

    console.log(`Processing RevenueCat event: ${eventType} for user: ${userId}, entitlements: ${entitlementIds.join(", ")}`);

    // Handle Pro Entitlement activation / renewal
    if (isOrganizerProEntitlement && (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL")) {
      const expirationDate = event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null;

      const { error } = await supabase
        .from("users")
        .update({
          is_organizer_pro: true,
          pro_expires_at: expirationDate,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update user to pro:", error);
        throw error;
      }

      console.log(`User ${userId} upgraded to Organizer Pro until ${expirationDate}`);
    } 
    // Handle Pro Entitlement expiration / cancellation
    else if (eventType === "CANCELLATION" || eventType === "EXPIRATION") {
      const { error } = await supabase
        .from("users")
        .update({
          is_organizer_pro: false,
        })
        .eq("id", userId);

      if (error) {
        console.error("Failed to revoke pro status:", error);
        throw error;
      }

      console.log(`User ${userId} Organizer Pro entitlement deactivated (${eventType})`);
    }

    return new Response(JSON.stringify({ success: true, processed: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("RevenueCat Webhook processing error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
