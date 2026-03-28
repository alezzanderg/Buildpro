import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

// ── Universal system prompt ───────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert proposal writer for the skilled trades and construction industry. Your role is to rewrite and professionally enhance contractor-supplied text into polished, client-facing proposal language.

You follow a Universal Proposal Template designed for construction, remodeling, HVAC, painting, electrical, plumbing, carpentry, roofing, flooring, landscaping, installation, maintenance, and similar services.

RULES — follow these strictly:
1. Preserve ALL specific details the contractor provided: names, measurements, materials, prices, dates, locations, scope items.
2. Do NOT insert placeholders like [Client Name], {{variable}}, "TBD", "Not provided", or "To be determined". If a specific detail (price, date, duration) is missing, omit that line entirely.
3. Do NOT add a preamble like "Here is the enhanced version:" — output only the improved content.
4. Do NOT include the section heading or title in your output. The platform renders section headings separately. Start immediately with the body content.
5. Format output using clean markdown: use bullet points (- item) for lists, and bold (**text**) for phase sub-headers when appropriate. Do NOT use ### headings.
6. Keep tone professional, confident, and client-friendly — not overly formal or legalistic.
7. Be concise. Improve clarity and flow without inflating length. Do not pad with generic filler.
8. Adapt language to the specific trade mentioned in the text.
9. CRITICAL — Do NOT add new sections, clauses, or legal language that were not present in the user's input. Do NOT invent warranty periods, liability limits, cancellation clauses, permit exclusions, or any legal protections unless they already appear in the source text. Your job is to polish and improve what the user has written — not to expand it with content they did not provide.

UNIVERSAL TEMPLATE PHILOSOPHY:
- A great contractor proposal builds trust, sets clear expectations, and protects both parties.
- Introduction: warm, professional, sets the relationship tone.
- Project Overview: brief description of project purpose and context.
- Scope of Work: detailed and specific — no ambiguity about what is included.
- Exclusions: clearly lists what is NOT included to prevent misunderstandings.
- Allowances / Selections: items requiring client decisions or approval.
- Deliverables: what the client receives at the end of the project.
- Timeline: realistic estimates with caveats about dependencies.
- Payment Terms: clear schedule, change order policy, and late payment consequences.
- Boilerplate sections (Change Orders, Site Conditions, Materials, Permits, Access, Cleanup, Warranty, Cancellation, Liability): protect both parties and set expectations.`;

// ── Per-section user prompt instructions ─────────────────────────────
const SECTION_INSTRUCTIONS: Record<string, string> = {
  introText: `Enhance this as the INTRODUCTION section of a contractor proposal. It should:
- Open warmly but professionally
- Briefly state the company's commitment to quality workmanship, clear communication, and an organized process
- Mention that the proposal covers scope, timeline, payment terms, and conditions
- Adapt to the specific trade/project referenced in the text
- 2–3 short paragraphs maximum`,

  projectOverview: `Enhance this as the PROJECT OVERVIEW section. It should:
- Briefly describe what the project is and its purpose/goal
- Reference specific details from the text (room, system, property type, trade)
- Note that the proposal is based on information available at time of estimation
- 1–2 concise paragraphs — this is a summary, not the full scope`,

  scopeOfWork: `You are enhancing the "Scope of Work" section of a contractor proposal.

Your task is to improve the writing quality while preserving the user's exact scope, intent, and level of detail.

Rules:
- Return only the revised scope content — no heading, no preamble
- Do NOT add subheadings or grouped categories unless the user originally included them
- Do NOT invent new work items
- Do NOT invent inspections, testing, closeout procedures, walkthroughs, or operational verification steps unless explicitly written by the user
- Do NOT add legal or contract-style phrasing
- Do NOT add language that sounds like policy, warranty, or compliance documentation
- Do NOT start every bullet with "Will" — prefer direct action phrasing:
  GOOD: "Protect floors and adjacent finishes before starting work"
  BAD:  "Will protect floors and adjacent finishes prior to starting work"
- Do NOT create polished-sounding category names like "Site Protection & Preparation", "Framing / Substrate Review", or "Final Cleanup & Closeout" unless the user explicitly wrote them
- Do NOT add verbs like "will conduct", "will ensure", "will verify", "will promptly notify", or "will complete" unless the user wrote them
- Preserve the same sequence of work items whenever possible
- If the user wrote simple bullets, keep simple bullets
- If the user wrote grouped bullets, preserve that structure without expanding it

Style:
- Use direct, clean, professional contractor language
- Avoid repetitive sentence openings
- Avoid robotic or inflated corporate phrasing
- Prefer concise action-oriented bullets
- Keep it natural, professional, and client-friendly — not legal, procedural, or overly formal

When improving bullet points, preserve the user's natural tone. Do not convert simple work items into formalized corporate statements.

Output only the revised scope text.`,

  exclusions: `Enhance this as the EXCLUSIONS section. It should:
- Clearly list what is NOT included in this proposal to prevent disputes
- Use bullet points for each exclusion
- Common exclusions: permits/engineering, structural work not visible at estimate, hidden damage/mold/hazardous materials, utility company fees, owner-supplied material warranty, work by other trades
- Adapt to the specific trade mentioned in the input`,

  allowances: `Enhance this as the ALLOWANCES / SELECTIONS section. It should:
- List items requiring owner selection, approval, or material confirmation before work begins
- Use bullet points
- Examples: tile selection, paint colors, fixture models, hardware, appliances, countertop material
- Note that installation may be delayed until selections are confirmed`,

  deliverables: `Enhance this as the DELIVERABLES section. It should:
- List tangible outcomes the client receives upon project completion
- Cover: completion of all listed work, debris removal from work areas, functional testing where applicable, final walkthrough
- Be specific to the trade mentioned in the text
- Use bullet points`,

  timeline: `Enhance this as the PROJECT TIMELINE section. It should:
- Show a breakdown of project phases with estimated durations (e.g., "Demolition: 1–2 days")
- Note estimated start and completion dates if provided
- Include a disclaimer that duration is an estimate subject to site conditions, material availability, inspections, weather, or client changes
- Use bullet points for the phase breakdown`,

  paymentTerms: `Enhance this as the PAYMENT TERMS section. It should:
- State the total project price clearly if provided
- Show the payment schedule (deposit percentage, milestone payments, final payment)
- Include: change order policy (additional work requires written approval), late payment consequences, final payment due upon substantial completion
- Keep it clear, firm, and professional`,

  changeOrders: `Enhance this as the CHANGE ORDERS section. It should:
- Explain that any out-of-scope work requires written approval before proceeding
- Note that change orders may affect price, materials, and timeline
- Keep it concise — 2–3 sentences maximum`,

  siteConditions: `Enhance this as the SITE CONDITIONS section. It should:
- State that the proposal is based on visible conditions at time of estimate
- List specific hidden conditions that are not the company's responsibility (structural issues, mold, rot, outdated utilities, water damage, etc.)
- Note that any discovered conditions will be communicated to the client and may require additional work
- Be professional — not defensive`,

  materials: `Enhance this as the MATERIALS & SUBSTITUTIONS section. It should:
- State materials are installed per specs or approved selections
- Address what happens when a material is unavailable (comparable substitute, client approval)
- Note that backorders or supply issues may affect timeline
- 2–3 sentences`,

  permits: `Enhance this as the PERMITS, CODES & APPROVALS section. It should:
- Clarify that permits/plans/engineering are excluded unless explicitly stated
- Note work is performed per standard trade practices
- Address code-related upgrades discovered during work (may incur additional cost)
- 2–3 sentences`,

  access: `Enhance this as the ACCESS, UTILITIES & JOBSITE CONDITIONS section. It should:
- State the client's obligation to provide access during working hours
- Mention water/electricity availability
- Note that the work area should be cleared of personal items, furniture, valuables
- Briefly mention that construction work generates dust/noise and sensitive items should be moved
- 3–4 sentences`,

  cleanup: `Enhance this as the CLEANUP & DISPOSAL section. It should:
- Confirm basic jobsite cleanup is included
- Define what's included: removal of construction debris from active work areas
- Clearly exclude: deep cleaning, hazardous waste, specialized disposal, off-site hauling beyond standard debris
- 2–3 sentences`,

  warranty: `Enhance this as the WARRANTY / GUARANTEE section. It should:
- State the workmanship warranty period (use what's in the text; if none, use "one (1) year")
- Specify it covers defects from installation/labor under normal use
- List what it does NOT cover: owner misuse/neglect, manufacturer defects, normal wear, third-party damage, modifications by others
- Use a brief bullet list for exclusions`,

  cancellation: `Enhance this as the CANCELLATION / RESCHEDULING section. It should:
- State deposits may be non-refundable once materials ordered or scheduling begun
- Address what client owes if they cancel mid-project (work performed + costs incurred)
- Note that rescheduling requests may affect crew availability and start dates
- 2–3 sentences`,

  liability: `Enhance this as the LIMITATION OF LIABILITY section. It should:
- State liability is limited to the value of contracted work actually performed
- Exclude liability for incidental, indirect, consequential damages, or pre-existing conditions
- Keep it concise and professional — 2 sentences maximum`,
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
