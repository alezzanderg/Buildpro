import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const SECTION_CONTEXT: Record<string, string> = {
  introText:    "a professional introduction / cover letter paragraph for a contractor proposal",
  scopeOfWork:  "a detailed scope of work section for a contractor proposal",
  deliverables: "a clear list of project deliverables for a contractor proposal",
  timeline:     "a professional project timeline for a contractor proposal",
  paymentTerms: "clear and fair payment terms for a contractor proposal",
  terms:        "standard contractor terms and conditions",
};

router.post("/proposals/enhance-text", async (req, res) => {
  const { text, section } = req.body as { text: string; section: string };

  if (!text?.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  const sectionDesc = SECTION_CONTEXT[section] ?? "a section of a professional contractor proposal";

  const systemPrompt = `You are a professional proposal writer specializing in the construction and contracting industry. 
Your task is to enhance and rewrite text provided by the contractor into clear, professional, and compelling language.
- Maintain the contractor's original intent and specific details (project names, prices, dates, locations)
- Use confident, professional language appropriate for client-facing documents
- Structure the text clearly with good flow
- Keep it concise but thorough
- Do NOT add placeholder text like [Client Name] or [Date] — keep all specifics as provided
- Do NOT add any preamble like "Here is the enhanced text:" — output only the improved content`;

  const userPrompt = `Please enhance this ${sectionDesc}. Keep all specific details but make it more professional and polished:\n\n${text}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

export default router;
