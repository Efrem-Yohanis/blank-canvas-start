import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/verse-explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { book, chapter, verse, text, reference, language } =
            (await request.json()) as {
              book: string;
              chapter: number;
              verse: number;
              text: string;
              reference?: string;
              language?: string;
            };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const langInstruction =
            language && language !== "en"
              ? `Reply entirely in the language with code "${language}". Do not include English.`
              : "Reply in clear English.";

          const systemPrompt = `You are a thoughtful Bible scholar. Provide a deep, faithful, and respectful explanation of the requested verse. Cover:
1. Historical and cultural context
2. Literary context within the chapter and book
3. Key words or phrases worth understanding
4. Theological meaning
5. Practical application
Keep it organized with short markdown headings. ${langInstruction}`;

          const userPrompt = `Verse: ${reference ?? `${book} ${chapter}:${verse}`}\nText: "${text}"\n\nExplain this verse in depth.`;

          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                ],
                stream: true,
              }),
            }
          );

          if (!upstream.ok) {
            if (upstream.status === 429) {
              return new Response(
                JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
                { status: 429, headers: { "Content-Type": "application/json" } }
              );
            }
            if (upstream.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
                { status: 402, headers: { "Content-Type": "application/json" } }
              );
            }
            const t = await upstream.text();
            return new Response(
              JSON.stringify({ error: "AI gateway error", detail: t }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
