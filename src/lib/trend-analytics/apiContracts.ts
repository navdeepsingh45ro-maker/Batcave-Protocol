export const TREND_ANALYTICS_API_ENDPOINTS = {
  report: {
    method: "GET",
    path: "/api/analytics/trends?start=YYYY-MM-DD&end=YYYY-MM-DD",
    description: "Return weekly/monthly scores, heatmap, identity participation, threat frequency, and countermeasure success."
  }
} as const;
