import type { ReportPriority } from "@prisma/client";

export type CategoryCandidate = {
  id: number;
  name: string;
  description: string | null;
};
export type CategorySuggestion = {
  categoryId: number | null;
  categoryName: string | null;
  confidence: number;
  reason: string;
};
export type PrioritySuggestion = {
  priority: ReportPriority;
  confidence: number;
  reasons: string[];
};

export interface AiProvider {
  readonly name: string;
  suggestCategory(input: {
    title: string;
    description: string;
    categories: CategoryCandidate[];
  }): Promise<CategorySuggestion>;
  suggestPriority(input: {
    title: string;
    description: string;
    upvoteCount: number;
    similarCount: number;
  }): Promise<PrioritySuggestion>;
  summarizeReport(input: {
    title: string;
    description: string;
    status: string;
    category: string;
    comments: string[];
  }): Promise<string>;
  draftResponse(input: {
    kind: "report" | "service-request";
    title: string;
    status: string;
    details: string;
  }): Promise<string>;
  summarizeAnalytics(input: Record<string, unknown>): Promise<string>;
}
