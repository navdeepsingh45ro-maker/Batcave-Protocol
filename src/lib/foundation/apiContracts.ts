export const FOUNDATION_API_ENDPOINTS = {
  config: {
    method: "GET",
    path: "/api/foundations/config",
    description: "Return identities, foundations, subtypes, constraints, and minimum viable wins."
  },
  logFoundation: {
    method: "POST",
    path: "/api/foundations/log",
    description: "Create or update one foundation completion."
  },
  today: {
    method: "GET",
    path: "/api/foundations/today?date=YYYY-MM-DD",
    description: "Return foundations completed and missed for one date."
  },
  weekly: {
    method: "GET",
    path: "/api/foundations/weekly?start=YYYY-MM-DD&end=YYYY-MM-DD",
    description: "Return daily foundation scores and weekly average."
  },
  analytics: {
    method: "GET",
    path: "/api/foundations/analytics?start=YYYY-MM-DD&end=YYYY-MM-DD",
    description: "Return streaks, completion frequency, most common subtype, and identity participation."
  },
  logNoPorn: {
    method: "POST",
    path: "/api/constraints/no-porn",
    description: "Create or update the daily No Porn constraint log."
  }
} as const;
