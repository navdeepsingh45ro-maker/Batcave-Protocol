export const COUNTERMEASURE_API_ENDPOINTS = {
  recommend: {
    method: "GET",
    path: "/api/countermeasures/recommend?states=Lonely,Heavy",
    description: "Return a primary, secondary, and emergency countermeasure stack with confidence scores."
  },
  complete: {
    method: "POST",
    path: "/api/countermeasures/complete",
    description: "Store whether the recommended countermeasure was accepted and completed."
  },
  effectiveness: {
    method: "GET",
    path: "/api/countermeasures/effectiveness",
    description: "Return most effective countermeasures based on completion history."
  },
  threats: {
    method: "GET",
    path: "/api/threats",
    description: "Return configurable threats and associated states."
  }
} as const;
