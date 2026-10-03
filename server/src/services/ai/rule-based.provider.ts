import { ReportPriority } from "@prisma/client";
import type {
  AiProvider,
  CategorySuggestion,
  PrioritySuggestion,
} from "./ai-provider";

const words = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export class RuleBasedProvider implements AiProvider {
  readonly name = "RULE_BASED";
  async suggestCategory({
    title,
    description,
    categories,
  }: Parameters<
    AiProvider["suggestCategory"]
  >[0]): Promise<CategorySuggestion> {
    const input = words(`${title} ${description}`);
    const ranked = categories
      .map((category) => {
        const categoryWords = words(
          `${category.name} ${category.description ?? ""}`,
        );
        let matches = 0;
        categoryWords.forEach((word) => {
          if (input.has(word)) matches++;
        });
        return {
          category,
          score: categoryWords.size ? matches / categoryWords.size : 0,
          matches,
        };
      })
      .sort((a, b) => b.score - a.score || b.matches - a.matches);
    const best = ranked[0];
    if (!best || best.matches === 0)
      return {
        categoryId: null,
        categoryName: null,
        confidence: 0,
        reason:
          "No category has a strong keyword match. Please select one manually.",
      };
    return {
      categoryId: best.category.id,
      categoryName: best.category.name,
      confidence: Math.min(0.95, 0.45 + best.score * 0.5),
      reason: `Matched the report wording with ${best.category.name}.`,
    };
  }
  async suggestPriority({
    title,
    description,
    upvoteCount,
    similarCount,
  }: Parameters<
    AiProvider["suggestPriority"]
  >[0]): Promise<PrioritySuggestion> {
    const text = `${title} ${description}`.toLowerCase(),
      reasons: string[] = [];
    let score = 0;
    if (
      /danger|injur|fire|flood|gas leak|electric|blocked road|emergency/.test(
        text,
      )
    ) {
      score += 3;
      reasons.push("Safety-impacting language was detected");
    }
    if (/urgent|severe|major|unusable|no water|power outage/.test(text)) {
      score += 2;
      reasons.push("High-impact wording was detected");
    }
    if (upvoteCount >= 5) {
      score++;
      reasons.push(`${upvoteCount} community supports indicate wider impact`);
    }
    if (similarCount >= 3) {
      score++;
      reasons.push("Several similar reports indicate a recurring issue");
    }
    const priority =
      score >= 4
        ? ReportPriority.URGENT
        : score >= 2
          ? ReportPriority.HIGH
          : score >= 1
            ? ReportPriority.MEDIUM
            : ReportPriority.LOW;
    if (!reasons.length)
      reasons.push("No urgent or broad-impact indicators were found");
    return {
      priority,
      confidence: Math.min(0.9, 0.55 + score * 0.08),
      reasons,
    };
  }
  async summarizeReport(input: Parameters<AiProvider["summarizeReport"]>[0]) {
    const discussion = input.comments.length
      ? ` Recent discussion: ${input.comments.slice(-3).join(" ")}`
      : " No comments have been added.";
    return `${input.title} is a ${label(input.status)} ${input.category} report. ${input.description.slice(0, 320)}${discussion}`;
  }
  async draftResponse(input: Parameters<AiProvider["draftResponse"]>[0]) {
    return `Thank you for your ${input.kind === "report" ? "report" : "service request"}. It is currently ${label(input.status)}. Our municipality team has reviewed the details and will provide further updates through Cityzen. ${input.details.slice(0, 180)}`.trim();
  }
  async summarizeAnalytics(input: Record<string, unknown>) {
    const reports = input.reports as Record<string, number> | undefined,
      requests = input.serviceRequests as Record<string, number> | undefined;
    return `During the selected period, ${reports?.total ?? 0} reports and ${requests?.total ?? 0} service requests were received. ${reports?.open ?? 0} reports and ${requests?.open ?? 0} service requests remain open. Review workload and category breakdowns before making operational decisions.`;
  }
}
