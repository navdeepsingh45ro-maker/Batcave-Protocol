import type { BeliefState } from "@/lib/belief-intelligence/types";
import type { NeuralCountermeasure, StateSuggestions } from "./types";

export const NEURAL_COUNTERMEASURES: NeuralCountermeasure[] = [
  // Recovery
  { id: "cm_tactical_nap", category: "Recovery", name: "Tactical Nap", description: "20-minute reset" },
  { id: "cm_recovery_walk", category: "Recovery", name: "Recovery Walk", description: "10-minute walk with no devices" },
  { id: "cm_stretch", category: "Recovery", name: "Stretch", description: "Release physical tension" },
  
  // Execution
  { id: "cm_five_min_rule", category: "Execution", name: "Five Minute Rule", description: "Commit to starting for just 5 minutes" },
  { id: "cm_one_small_step", category: "Execution", name: "One Small Step", description: "Execute the absolute smallest action possible" },
  { id: "cm_deep_work_sprint", category: "Execution", name: "Deep Work Sprint", description: "25 minutes of unbroken focus" },

  // Mindset
  { id: "cm_decision_matrix", category: "Mindset", name: "Decision Matrix", description: "Re-read empowering belief" },
  { id: "cm_belief_transform", category: "Mindset", name: "Belief Transformation", description: "Identify and flip limiting belief" },

  // Environment
  { id: "cm_remove_phone", category: "Environment", name: "Remove Phone", description: "Place device in another room" },
  { id: "cm_change_workspace", category: "Environment", name: "Change Workspace", description: "Relocate to shift perspective" },

  // Social
  { id: "cm_call_friend", category: "Social", name: "Call Friend", description: "Meaningful social connection" },
  { id: "cm_family_time", category: "Social", name: "Family Time", description: "Disconnect and engage" },

  // Health
  { id: "cm_hydrate", category: "Health", name: "Hydrate", description: "Drink a large glass of water" },
  { id: "cm_eat", category: "Health", name: "Eat", description: "Refuel body" },

  // Planning
  { id: "cm_break_task", category: "Planning", name: "Break Task", description: "Break task into microscopic steps" },
  { id: "cm_reprioritize", category: "Planning", name: "Reprioritize", description: "Cut non-essential objectives for today" },
];

export const STATE_SUGGESTIONS: Partial<Record<BeliefState, StateSuggestions>> = {
  // POSITIVE
  Focused: {
    thoughts: ["I know what I need to do.", "I'm making progress.", "I want to finish this."],
    causes: ["Clear Plan", "Good Sleep", "Momentum", "Fewer Interruptions"]
  },
  Motivated: {
    thoughts: ["I'm excited to execute.", "This matters to me.", "Let's push harder."],
    causes: ["Progress", "Inspiration", "Energy Peak", "Clarity"]
  },
  Confident: {
    thoughts: ["I can handle this.", "I've prepared for this.", "This is easy."],
    causes: ["Preparation", "Past Success", "Competence", "Readiness"]
  },
  Calm: {
    thoughts: ["Everything is under control.", "I have enough time.", "I am centered."],
    causes: ["Meditation", "Rest", "Order", "No Urgent Threats"]
  },
  Disciplined: {
    thoughts: ["I will do this regardless of how I feel.", "Stick to the plan.", "No excuses."],
    causes: ["Strong Commitment", "High Stakes", "System Alignment"]
  },
  "Flow State": {
    thoughts: ["I'm totally immersed.", "Time is flying.", "This feels effortless."],
    causes: ["Deep Work", "Optimal Challenge", "Zero Distractions"]
  },

  // NEUTRAL
  Reflective: {
    thoughts: ["What went wrong?", "How can I improve?", "I need to review."],
    causes: ["Post-Action", "Transition", "End of Day"]
  },
  Recovering: {
    thoughts: ["I need a break.", "Taking it easy today.", "Recharging."],
    causes: ["Intense Output", "Illness", "Poor Sleep"]
  },
  Thinking: {
    thoughts: ["How do I solve this?", "I need more context.", "I'm planning."],
    causes: ["Complex Problem", "Ambiguity", "Strategy Session"]
  },
  Curious: {
    thoughts: ["How does this work?", "What if I tried this?", "I want to learn."],
    causes: ["New Information", "Novel Problem", "Exploration"]
  },
  Observing: {
    thoughts: ["Just watching.", "Taking it in.", "No immediate action needed."],
    causes: ["Learning", "Waiting", "Passive State"]
  },

  // NEGATIVE
  Heavy: {
    thoughts: ["Everything feels difficult.", "I don't feel like starting.", "I have no energy."],
    causes: ["Poor Sleep", "Burnout", "Poor Diet", "Sedentary"]
  },
  Lonely: {
    thoughts: ["I miss someone.", "I feel disconnected.", "No one understands."],
    causes: ["Missing Connection", "Isolation", "Conflict"]
  },
  Anxious: {
    thoughts: ["What if I fail?", "There isn't enough time.", "I'm falling behind."],
    causes: ["Fear of Failure", "Looming Deadline", "Uncertainty"]
  },
  Overwhelmed: {
    thoughts: ["There's too much to do.", "I don't know where to start.", "I can't handle this."],
    causes: ["Too Many Tasks", "No Prioritization", "Context Switching"]
  },
  Frustrated: {
    thoughts: ["This isn't working.", "I'm stuck.", "People are incompetent."],
    causes: ["Blocked Project", "Interruption", "Technical Issue"]
  },
  Fatigued: {
    thoughts: ["I need sleep.", "My brain is fried.", "I can't focus."],
    causes: ["Sleep Deprivation", "Long Hours", "Physical Exhaustion"]
  },
  Disconnected: {
    thoughts: ["I don't care about this.", "What's the point?", "I'm just going through the motions."],
    causes: ["Lack of Purpose", "Boredom", "Misalignment"]
  }
};
