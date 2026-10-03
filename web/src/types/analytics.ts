export type CountBreakdown = {
  status?: string;
  priority?: string;
  category?: string;
  type?: string;
  severity?: string;
  count: number;
};
export type AnalyticsOverview = {
  range: { from: string; to: string; departmentId: number | null };
  reports: { total: number; open: number; resolved: number; rejected: number };
  serviceRequests: {
    total: number;
    open: number;
    completed: number;
    rejected: number;
  };
  citizenFeedback: { averageRating: number | null; responseCount: number };
  work: {
    averageReportResolutionHours: number | null;
    averageServiceCompletionHours: number | null;
  };
};
export type ReportAnalytics = {
  statusBreakdown: CountBreakdown[];
  priorityBreakdown: CountBreakdown[];
  categoryBreakdown: (CountBreakdown & {
    categoryId: number;
    category: string;
    percentage: number;
  })[];
  resolutionTime: {
    averageHours: number | null;
    medianHours: number | null;
    minimumHours: number | null;
    maximumHours: number | null;
    count: number;
  };
};
export type ServiceAnalytics = {
  statusBreakdown: CountBreakdown[];
  mostUsedServices: { serviceId: number; service: string; count: number }[];
  completionTime: ReportAnalytics["resolutionTime"];
  appointments: {
    totalSlots: number;
    totalCapacity: number;
    bookings: number;
    remainingCapacity: number;
    completedAppointments: number;
  };
};
export type FeedbackAnalytics = {
  averageRating: number | null;
  feedbackCount: number;
  confirmedResolvedPercentage: number | null;
  ratingDistribution: { rating: number; count: number }[];
  byCategory: {
    categoryId: number;
    category: string;
    averageRating: number;
    responseCount: number;
  }[];
};
export type WorkloadAnalytics = {
  reports: { unassigned: number; inProgress: number };
  serviceRequests: { unassigned: number; inProgress: number };
  employees: {
    id: number;
    name: string;
    assignedReports: number;
    assignedServiceRequests: number;
  }[];
};
export type TrendPoint = {
  bucket: string;
  reportsCreated: number;
  reportsResolved: number;
  requestsSubmitted: number;
  requestsCompleted: number;
};
