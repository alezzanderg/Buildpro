import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// ── Universal system prompt ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert proposal writer for the skilled trades and construction industry. Your role is to rewrite and professionally enhance contractor-supplied text into polished, client-facing proposal language.

You follow a Universal Proposal Template designed for construction, remodeling, HVAC, painting, electrical, plumbing, carpentry, roofing, flooring, landscaping, installation, maintenance, and similar services.

RULES — follow these strictly:
1. Preserve ALL specific details the contractor provided: names, measurements, materials, prices, dates, locations, scope items.
2. Do NOT insert placeholders like [Client Name], {{variable}}, or "TBD" — use actual text from the input.
3. Do NOT add a preamble like "Here is the enhanced version:" — output only the improved content.
4. Format output using clean markdown: use bullet points (- item) for lists, and bold (**text**) for key terms or phase headers when appropriate. Do NOT use ### headings inside sections.
5. Keep tone professional, confident, and client-friendly — not overly formal or legalistic.
6. Be thorough but concise. Eliminate vague filler phrases. Every sentence should add value.
7. Adapt language to the specific trade (HVAC, plumbing, electrical, general construction, etc.) based on cues in the provided text.

UNIVERSAL TEMPLATE PHILOSOPHY:
- A great contractor proposal builds trust, sets clear expectations, and protects both parties.
- Introduction: warm, professional, sets the relationship tone.
- Scope of Work: detailed and specific — no ambiguity about what is included.
- Deliverables: what the client receives at the end of the project.
- Timeline: realistic estimates with caveats about dependencies.
- Payment Terms: clear schedule, change order policy, and late payment consequences.
- Terms & Conditions: protects both parties — covers site conditions, hidden damage, permits, materials, warranty, cancellation, and liability.`;

// ── Per-section user prompt instructions ─────────────────────────────
const SECTION_INSTRUCTIONS: Record<string, string> = {
  introText: `Enhance this as the INTRODUCTION section of a contractor proposal. It should:
- Open warmly but professionally
- Briefly state the company's commitment to quality workmanship, communication, and organized process
- Mention that the proposal covers scope, timeline, payment terms, and conditions
- Adapt to the specific trade/project referenced in the text
- 2–3 short paragraphs maximum`,

  scopeOfWork: `Enhance this as the SCOPE OF WORK section. It should:
- List all work included clearly and specifically
- Use bullet points grouped by trade phase (e.g., Demolition, Plumbing, Electrical, Finish Work)
- Use confident, definitive language ("will install", "will replace", not "may" or "might")
- Convert any vague suggestions into clear, committed deliverables
- Include inspection, testing, and basic cleanup language if relevant
- Do NOT include items that should be in Exclusions`,

  deliverables: `Enhance this as the DELIVERABLES section. It should:
- List tangible outcomes the client will receive upon project completion
- Cover: completion of all listed work, basic debris removal, functional testing where applicable, final walkthrough
- Be specific to the trade mentioned in the text
- Use bullet points
- Should complement (not repeat word-for-word) the Scope of Work`,

  timeline: `Enhance this as the PROJECT TIMELINE section. It should:
- Show a breakdown of project phases with estimated durations (e.g., "Demolition: 1–2 days")
- Note the estimated start and completion if dates are provided
- Include a disclaimer that duration is an estimate subject to site conditions, material availability, inspections, weather, or client changes
- Use bullet points for the phase breakdown`,

  paymentTerms: `Enhance this as the PAYMENT TERMS section. It should:
- State the total project price clearly if provided
- Show the payment schedule (deposit percentage, milestone payments, final payment)
- Include: change order policy (any additional work requires written approval), late payment consequences (may delay scheduling or material ordering), final payment due upon substantial completion
- Keep it clear, firm, and professional`,

  terms: `Enhance this as the TERMS & CONDITIONS section. It should cover ALL of the following, adapted to the specific trade/project:
- **Change Orders**: any out-of-scope work requires written approval and may affect price/timeline
- **Site Conditions**: proposal based on visible conditions; hidden damage, mold, rot, structural issues, outdated utilities may require additional work and cost
- **Materials & Substitutions**: materials as specified; if unavailable, comparable substitute subject to client approval
- **Permits, Codes & Approvals**: unless explicitly stated, permits/plans/engineering are excluded; code-related upgrades discovered during work may incur additional cost
- **Access & Utilities**: client provides reasonable access during working hours, water, electricity available as needed
- **Cleanup & Disposal**: basic jobsite cleanup included; hazardous waste, deep cleaning, specialized disposal excluded unless stated
- **Warranty / Guarantee**: workmanship warranty period (use what contractor specified or a reasonable standard period); does not cover owner abuse, manufacturer defects, normal wear, third-party damage
- **Cancellation**: deposit may be non-refundable once materials ordered or scheduling begun; if cancelled, client pays for work performed plus costs incurred
- **Limitation of Liability**: liability limited to value of contracted work performed; no liability for consequential or indirect damages

Format with bold headers (**Change Orders**, **Site Conditions**, etc.) followed by 1–3 sentences each.`,
};

router.post("/proposals/enhance-text", async (req, res) => {
  const { text, section } = req.body as { text: string; section: string };

  if (!text?.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  const instructions = SECTION_INSTRUCTIONS[section]
    ?? "Enhance this section of a professional contractor proposal. Make it clear, professional, and client-ready while preserving all specific details.";

  const userPrompt = `${instructions}

Contractor's draft text to enhance:
"""
${text}
"""`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
