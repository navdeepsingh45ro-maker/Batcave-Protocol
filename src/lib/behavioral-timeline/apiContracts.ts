export const BEHAVIORAL_TIMELINE_API_ENDPOINTS = {
  createEvent: {
    method: "POST",
    path: "/api/timeline/events",
    description: "Store one timeline event in the state-to-action chain."
  },
  day: {
    method: "GET",
    path: "/api/timeline/day?date=YYYY-MM-DD",
    description: "Return the ordered behavioral timeline and chain summary for one day."
  },
  workingChains: {
    method: "GET",
    path: "/api/timeline/working-chains?start=YYYY-MM-DD&end=YYYY-MM-DD",
    description: "Return chains where countermeasures were followed by foundation completion."
  }
} as const;
