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
- Be concise. No prose, only call the tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
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

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this food photo. Estimate protein, carbs, and fat in grams." },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_food",
              description: "Return the detected food and estimated macros.",
              parameters: {
                type: "object",
                properties: {
                  foodName: { type: "string", description: "Concise name e.g. 'Grilled Chicken Breast'." },
                  proteinGrams: { type: "integer", description: "Estimated protein grams (whole number)." },
                  carbsGrams: { type: "integer", description: "Estimated carbohydrate grams (whole number, 0 if negligible)." },
                  fatsGrams: { type: "integer", description: "Estimated fat grams (whole number, 0 if negligible)." },
                  portion: { type: "string", description: "Estimated portion e.g. '1 breast (~150g)'." },
                  confidence: { type: "number", description: "0.0 to 1.0" },
                  mealType: { type: ["string", "null"], enum: ["breakfast", "lunch", "dinner", "snack", null] },
                  notes: { type: "string" },
                },
                required: ["foodName", "proteinGrams", "carbsGrams", "fatsGrams", "confidence", "portion"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_food" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds to your Lovable workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI vision call failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "AI returned no analysis" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = typeof args === "string" ? JSON.parse(args) : args;

    return new Response(JSON.stringify({
      foodName: String(parsed.foodName ?? "Unknown food"),
      proteinGrams: Math.max(0, Math.round(Number(parsed.proteinGrams) || 0)),
      carbsGrams: Math.max(0, Math.round(Number(parsed.carbsGrams) || 0)),
      fatsGrams: Math.max(0, Math.round(Number(parsed.fatsGrams) || 0)),
      portion: String(parsed.portion ?? ""),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      mealType: parsed.mealType ?? null,
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
