import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a precise nutrition vision analyst. Identify the food shown in the image and estimate its macros.

Rules:
- Identify the most prominent food item (or main dish) in the photo.
- Estimate portion size from visual cues (plate size, utensil, hand, packaging).
- Return PROTEIN GRAMS, CARB GRAMS, FAT GRAMS, and CALORIES (kcal) as integers (round to nearest whole number). Protein is the most important — be most precise there. Carbs/fats can be 0 if clearly negligible. Calories should reflect the realistic kcal of the portion (roughly 4·protein + 4·carbs + 9·fat, but use your judgement for cooking oils/sauces).
- Confidence is 0.0-1.0. If the image is unclear / not food, set confidence < 0.3 and explain in notes.
- Suggest a meal type only if obvious (otherwise null).
- Be concise. Only return the JSON.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    foodName: { type: "string" },
    proteinGrams: { type: "integer" },
    carbsGrams: { type: "integer" },
    fatsGrams: { type: "integer" },
    caloriesKcal: { type: "integer" },
    portion: { type: "string" },
    confidence: { type: "number" },
    mealType: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack", "none"] },
    notes: { type: "string" },
  },
  required: ["foodName", "proteinGrams", "carbsGrams", "fatsGrams", "caloriesKcal", "confidence", "portion"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const imageDataUrl: string | undefined = body?.imageDataUrl;
    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "imageDataUrl (data URL) is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse data URL: data:image/jpeg;base64,XXXX
    const match = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Invalid image data URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const model = "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const aiResp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: "Analyze this food photo. Estimate protein, carbs, fat in grams, and calories in kcal." },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2,
        },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("Gemini error", aiResp.status, t);
      if (aiResp.status === 429) {
        // Distinguish "key has zero quota" (broken/billing-less project)
        // from a real per-minute burst rate limit.
        const noQuota = /limit:\s*0\b/i.test(t) || /GenerateRequestsPerDay/i.test(t);
        if (noQuota) {
          return new Response(JSON.stringify({
            error: "AI key has no quota. Generate a fresh key at aistudio.google.com/apikey (use 'Create API key in new project') and update GEMINI_API_KEY.",
          }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 401 || aiResp.status === 403) {
        return new Response(JSON.stringify({ error: "Invalid Gemini API key." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI vision call failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Gemini response status:", aiResp.status);
    const rawText = await aiResp.text();
    console.log("Gemini raw response text:", rawText);

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Gemini outer JSON parse error:", parseErr, "raw:", rawText);
      return new Response(JSON.stringify({ error: "Failed to parse Gemini response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini returned no text part. Full data:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI returned no analysis" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Gemini inner text payload:", text);
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      console.error("Gemini inner JSON parse error:", parseErr, "text:", text);
      return new Response(JSON.stringify({ error: "Failed to parse AI analysis JSON" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const meal = parsed.mealType && parsed.mealType !== "none" ? parsed.mealType : null;

    return new Response(JSON.stringify({
      foodName: String(parsed.foodName ?? "Unknown food"),
      proteinGrams: Math.max(0, Math.round(Number(parsed.proteinGrams) || 0)),
      carbsGrams: Math.max(0, Math.round(Number(parsed.carbsGrams) || 0)),
      fatsGrams: Math.max(0, Math.round(Number(parsed.fatsGrams) || 0)),
      caloriesKcal: Math.max(0, Math.round(Number(parsed.caloriesKcal) || 0)),
      portion: String(parsed.portion ?? ""),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      mealType: meal,
      notes: parsed.notes ?? "",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-food error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
