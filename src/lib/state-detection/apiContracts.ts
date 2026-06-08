export const STATE_DETECTION_API_ENDPOINTS = {
  config: {
    method: "GET",
    path: "/api/state-detection/config",
    description: "Return states, configurable risk weights, thresholds, and interventions."
  },
  checkIn: {
    method: "POST",
    path: "/api/state-detection/check-in",
    description: "Store one quick state check-in and return risk score, risk level, and recommendations."
  },
  today: {
    method: "GET",
    path: "/api/state-detection/today?date=YYYY-MM-DD",
    description: "Return today's selected states, risk level, and recommended next actions."
  },
  correlations: {
    method: "GET",
    path: "/api/state-detection/correlations?start=YYYY-MM-DD&end=YYYY-MM-DD",
    description: "Return learned state-to-behavior correlation statistics."
  },
  analytics: {
    method: "GET",
    path: "/api/state-detection/analytics?start=YYYY-MM-DD&end=YYYY-MM-DD",
    description: "Return common states, high-risk days, trends, correlations, and intervention effectiveness."
  },
  interventionResult: {
    method: "POST",
    path: "/api/state-detection/interventions/result",
    description: "Store whether a recommended intervention was accepted and effective."
  }
} as const;
