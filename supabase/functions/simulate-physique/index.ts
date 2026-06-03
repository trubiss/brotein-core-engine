// Generates a "12-week potential" physique simulation from a user photo.
// Uses Gemini's image edit/generation model via Lovable AI gateway.
//
// Privacy: input photos are NEVER stored server-side. They are forwarded
// to the model in-memory and discarded when the request completes.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Goal = "hypertrophy" | "equilibrium" | "recovery";

function buildPrompt(goal: Goal, weeks: number, proteinTarget?: number) {
  const goalText =
    goal === "hypertrophy"
      ? "added lean muscle mass with visible hypertrophy in shoulders, chest, arms and back"
      : goal === "recovery"
      ? "a healthier, recovered, more athletic physique with restored muscle tone"
      : "a leaner, more defined version with reduced body fat and clearer muscle definition";

  return [
    `Edit this physique reference photo to show a realistic artistic visualization of the same person after ${weeks} weeks of consistent training and disciplined protein intake${proteinTarget ? ` (~${proteinTarget}g/day)` : ""}.`,
    `Show ${goalText}.`,
    `STRICT RULES:`,
    `- Keep the same person: same face, same skin tone, same hair, same general body proportions and height.`,
    `- Keep the same pose, framing, background, lighting, and clothing.`,
    `- Realistic and natural — NOT bodybuilder extreme, NOT unrealistic. Subtle, believable 12-week progress.`,
    `- High photographic quality, sharp focus.`,
    `- Do NOT add text, watermarks, or logos.`,
  ].join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const imageDataUrl: string | undefined = body?.imageDataUrl;
    const goal: Goal = (body?.goal as Goal) || "hypertrophy";
    const weeks: number = Number(body?.weeks) || 12;
    const proteinTarget: number | undefined = body?.proteinTarget
      ? Number(body.proteinTarget)
      : undefined;

    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "imageDataUrl (data URL) is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(goal, weeks, proteinTarget);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Too many simulations — try again in a minute." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted — top up your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Surface content-policy rejections clearly
      let message = "Simulation failed";
      try {
        const j = JSON.parse(errText);
        if (j?.error?.message) message = String(j.error.message);
      } catch { /* ignore */ }
      return new Response(JSON.stringify({ error: message }), {
        status: aiResp.status >= 400 && aiResp.status < 500 ? 400 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.error("AI returned no image", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned no image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ imageDataUrl: `data:image/png;base64,${b64}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("simulate-physique error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
