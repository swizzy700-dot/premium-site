import type { LighthouseClientAudit, LighthouseScoreKey } from "@/lib/website-checker/lighthouse/types";

export type AssistantIntent = "requestQuotation" | "talkToExpert" | "viewServices" | "general";

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export function detectIntent(message: string): AssistantIntent {
  const m = normalize(message);
  if (/(quote|quotation|pricing|cost|estimate|budget)/.test(m)) return "requestQuotation";
  if (/(expert|talk|call|consult|human)/.test(m)) return "talkToExpert";
  if (/(service|services|offer|packages|what do you do)/.test(m)) return "viewServices";
  return "general";
}

export function buildAssistantReply(args: {
  message: string;
  audit: LighthouseClientAudit | null;
}) {
  const { message, audit } = args;
  const m = normalize(message);
  const intent = detectIntent(message);

  if (!audit) {
    return {
      intent,
      reply:
        "I can explain your Lighthouse scores, highlight issues, and recommend conversion-focused next steps. Start an audit first, and I’ll tailor the guidance to your site.",
      followUp: "What website URL are you auditing?",
      suggestedPrompts: ["Start an audit", "Explain scores", "Request a quotation"],
    };
  }

  // Defensive validation for audit.scores
  if (!audit?.scores || typeof audit.scores !== 'object') {
    return {
      intent,
      message: "I need valid audit scores to provide specific recommendations. Please run a website audit first.",
      followUp: "Would you like me to help you start a new audit?",
      suggestedPrompts: ["Start an audit", "Explain the audit process"],
    };
  }

  const scoreKeys = Object.keys(audit.scores) as LighthouseScoreKey[];
  const worstKey = scoreKeys.slice().sort((a, b) => audit.scores[a].score - audit.scores[b].score)[0];
  const worst = audit.scores[worstKey];
  const s = Object.fromEntries(scoreKeys.map((k) => [k, audit.scores[k].score])) as Record<LighthouseScoreKey, number>;

  const scoreBits = scoreKeys
    .map((k) => `${k === "best-practices" ? "Best Practices" : k[0].toUpperCase() + k.slice(1)} ${Math.round(s[k])}/100`)
    .join(" • ");

  const topRecommendation = audit.recommendations[0];
  const topRecText = topRecommendation ? topRecommendation.title : "the highest-impact fixes";

  if (intent === "requestQuotation") {
    return {
      intent,
      reply:
        `Based on your Lighthouse audit, your ${worstKey === "best-practices" ? "Best Practices" : worstKey.toUpperCase()} is currently ${worst.label}. ` +
        `The quickest conversion lift usually comes from focusing on: ${topRecText}. ` +
        "If you’d like, request a professional quote for a conversion-focused implementation plan.",
      followUp: "Do you want a quick budget range or a detailed scope proposal?",
      suggestedPrompts: ["Request Quotation", "Talk to Expert", "View Services"],
    };
  }

  if (intent === "talkToExpert") {
    return {
      intent,
      reply:
        `You’re close. Your audit shows the biggest leverage is in ${worstKey === "best-practices" ? "Best Practices" : worstKey}. ` +
        "Talking to an expert helps you turn recommendations into an execution plan your team can ship confidently.",
      followUp: "What’s your timeline for improvements (this month, next quarter, or later)?",
      suggestedPrompts: ["Talk to Expert", "Request Quotation", "View Services"],
    };
  }

  if (intent === "viewServices") {
    return {
      intent,
      reply:
        "Here’s the fastest route: start with the category that’s holding your conversions back, then expand to supporting fixes for SEO and usability. " +
        `Your weakest area is ${worstKey === "best-practices" ? "Best Practices" : worstKey}.`,
      followUp: `Want me to recommend an implementation path for ${worstKey === "best-practices" ? "Best Practices" : worstKey}?`,
      suggestedPrompts: ["View Services", "Request Quotation", "Talk to Expert"],
    };
  }

  // General guided explanation.
  const explicitlyAskedScores = /(performance|seo|accessibility|best practices|scores|score)/.test(m);

  if (explicitlyAskedScores) {
    return {
      intent: "general" as const,
      reply:
        `Here’s what your Lighthouse audit suggests: ${scoreBits}. ` +
        `The biggest leverage right now is ${worstKey === "best-practices" ? "Best Practices" : worstKey} (${worst.label}). ` +
        audit.overallExplanation,
      followUp: "Want me to summarize the top issues and recommended fixes?",
      suggestedPrompts: ["Prioritize fixes", "Request Quotation", "View Services"],
    };
  }

  if (/(fix|improve|optimize|recommend)/.test(m)) {
    return {
      intent: "general" as const,
      reply:
        `Great question. Your audit indicates the fastest conversion path starts with ${topRecText}. ` +
        "If you implement these fixes in order, your site becomes easier to use and more trustworthy for real visitors.",
      followUp: "Should I prioritize Performance, SEO, Accessibility, or Best Practices first?",
      suggestedPrompts: ["Performance first", "SEO first", "Accessibility & conversions"],
    };
  }

  return {
    intent: "general" as const,
    reply:
      "I can explain your Lighthouse scores and recommend conversion-focused next steps. " +
      `Right now, the biggest leverage point is ${worstKey === "best-practices" ? "Best Practices" : worstKey} (${worst.label}).`,
    followUp: "What outcome matters most to you: more qualified leads, faster pages, or better usability?",
    suggestedPrompts: ["More qualified leads", "Faster pages", "Better usability"],
  };
}

