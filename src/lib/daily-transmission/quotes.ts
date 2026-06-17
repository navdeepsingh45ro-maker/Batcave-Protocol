import type { TransmissionQuote, QuoteCategory, QuoteSource } from "./types";

// ============================================================================
// BATCAVE DAILY TRANSMISSION — CURATED QUOTE LIBRARY
// 150 quotes across 5 categories: discipline, responsibility, persistence,
// leadership, growth
// ============================================================================

export const QUOTE_LIBRARY: TransmissionQuote[] = [
  // ==========================================================================
  // DISCIPLINE (30 quotes)
  // Batman (8), Daredevil (5), Rocky (6), Creed (4), Jocko Willink (3),
  // Marcus Aurelius (4)
  // ==========================================================================

  // --- Batman (8) ---
  {
    id: "q001",
    text: "It's not who I am underneath, but what I do that defines me.",
    source: { name: "Batman", origin: "Batman Begins" },
    category: "discipline",
    meaning:
      "Identity is forged through action, not intention. Stop describing who you want to be and start doing what that person would do.",
    tags: ["discipline", "execution", "consistency"],
  },
  {
    id: "q002",
    text: "The training is nothing. The will is everything. The will to act.",
    source: { name: "Batman", origin: "Batman Begins" },
    category: "discipline",
    meaning:
      "Skill without willpower is wasted potential. Build the internal drive to execute even when motivation fades.",
    tags: ["discipline", "execution", "mastery"],
  },
  {
    id: "q003",
    text: "I wear a mask. And that mask is not to hide who I am, but to create what I am.",
    source: { name: "Batman", origin: "DC Comics" },
    category: "discipline",
    meaning:
      "The persona you build through discipline becomes your real identity. Construct yourself deliberately through daily choices.",
    tags: ["discipline", "mastery", "consistency"],
  },
  {
    id: "q004",
    text: "Everything's impossible until somebody does it.",
    source: { name: "Batman", origin: "DC Comics" },
    category: "discipline",
    meaning:
      "Don't let the absence of precedent stop you. Be the proof that something can be done by doing it first.",
    tags: ["discipline", "execution", "momentum"],
  },
  {
    id: "q005",
    text: "A hero can be anyone. Even a man doing something as simple as putting a coat around a boy's shoulders to let him know the world hadn't ended.",
    source: { name: "Batman", origin: "The Dark Knight Rises" },
    category: "discipline",
    meaning:
      "Discipline isn't always grand gestures. Small, consistent acts of showing up for others build heroic character.",
    tags: ["discipline", "consistency", "connection"],
  },
  {
    id: "q006",
    text: "I have one power. I never give up.",
    source: { name: "Batman", origin: "DC Comics" },
    category: "discipline",
    meaning:
      "When you lack natural advantages, relentless persistence becomes your superpower. Outlast everyone else.",
    tags: ["discipline", "endurance", "resilience"],
  },
  {
    id: "q007",
    text: "Sometimes it's only madness that makes us what we are.",
    source: { name: "Batman", origin: "DC Comics" },
    category: "discipline",
    meaning:
      "The obsession others call extreme is the same force that produces extraordinary results. Channel intensity productively.",
    tags: ["discipline", "mastery", "momentum"],
  },
  {
    id: "q008",
    text: "The night is darkest just before the dawn. And I promise you, the dawn is coming.",
    source: { name: "Batman", origin: "The Dark Knight" },
    category: "discipline",
    meaning:
      "Hold your discipline steady during the worst moments. Breakthroughs are often closest when things feel most impossible.",
    tags: ["discipline", "endurance", "hope"],
  },

  // --- Daredevil (5) ---
  {
    id: "q009",
    text: "I'm not seeking penance for what I've done. I'm asking forgiveness for what I'm about to do.",
    source: { name: "Daredevil", origin: "Daredevil (Netflix)" },
    category: "discipline",
    meaning:
      "Discipline means making hard decisions ahead of time. Prepare yourself mentally for the difficult path you've chosen.",
    tags: ["discipline", "execution", "resilience"],
  },
  {
    id: "q010",
    text: "The city needs someone who's not afraid to stand up and do what's right, even when it hurts.",
    source: { name: "Daredevil", origin: "Daredevil (Netflix)" },
    category: "discipline",
    meaning:
      "Doing the right thing and the easy thing are rarely the same. Discipline is choosing the right thing consistently.",
    tags: ["discipline", "execution", "endurance"],
  },
  {
    id: "q011",
    text: "I'd rather die as the Devil than live as Matt Murdock.",
    source: { name: "Daredevil", origin: "Daredevil (Netflix)" },
    category: "discipline",
    meaning:
      "When you commit to a mission, half-measures destroy you. Full commitment to your purpose is the only path forward.",
    tags: ["discipline", "execution", "consistency"],
  },
  {
    id: "q012",
    text: "You can't stop what's coming. You can only be ready for it.",
    source: { name: "Daredevil", origin: "Daredevil (Netflix)" },
    category: "discipline",
    meaning:
      "Discipline is about preparation, not prediction. Train so that when adversity arrives, your response is automatic.",
    tags: ["discipline", "mastery", "resilience"],
  },
  {
    id: "q013",
    text: "Every time I get knocked down, I get back up. That's all I know how to do.",
    source: { name: "Daredevil", origin: "Daredevil (Netflix)" },
    category: "discipline",
    meaning:
      "Recovery is a skill you train. Make getting back up so habitual that staying down never becomes an option.",
    tags: ["discipline", "recovery", "resilience"],
  },

  // --- Rocky (6) ---
  {
    id: "q014",
    text: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    source: { name: "Rocky Balboa", origin: "Rocky Balboa (2006)" },
    category: "discipline",
    meaning:
      "Toughness isn't about offense — it's about absorption. Build your capacity to take damage and keep progressing.",
    tags: ["discipline", "resilience", "endurance"],
  },
  {
    id: "q015",
    text: "Going in one more round when you don't think you can — that's what makes all the difference in your life.",
    source: { name: "Rocky Balboa", origin: "Rocky (1976)" },
    category: "discipline",
    meaning:
      "Your edge over everyone else is one more rep, one more attempt, one more day of effort when quitting feels logical.",
    tags: ["discipline", "endurance", "one-step"],
  },
  {
    id: "q016",
    text: "Every champion was once a contender who refused to give up.",
    source: { name: "Rocky Balboa", origin: "Rocky Balboa (2006)" },
    category: "discipline",
    meaning:
      "There's no shortcut from where you are to the top. The only constant in every success story is the refusal to stop.",
    tags: ["discipline", "persistence", "endurance"],
  },
  {
    id: "q017",
    text: "Nobody owes nobody nothing. You owe yourself.",
    source: { name: "Rocky Balboa", origin: "Rocky (1976)" },
    category: "discipline",
    meaning:
      "Stop waiting for external validation or permission. Your accountability is to yourself and the standards you've set.",
    tags: ["discipline", "execution", "consistency"],
  },
  {
    id: "q018",
    text: "Time takes everybody out. It's undefeated. But you can still earn respect by standing tall against it.",
    source: { name: "Rocky Balboa", origin: "Rocky Balboa (2006)" },
    category: "discipline",
    meaning:
      "You won't win every battle, but showing up fully earns something no loss can take away. Fight the full fight.",
    tags: ["discipline", "endurance", "resilience"],
  },
  {
    id: "q019",
    text: "You, me, or nobody is gonna hit as hard as life. But it ain't about how hard you hit.",
    source: { name: "Rocky Balboa", origin: "Rocky Balboa (2006)" },
    category: "discipline",
    meaning:
      "Life's impact is unavoidable. Redirect your energy from trying to avoid pain toward building your ability to endure it.",
    tags: ["discipline", "resilience", "recovery"],
  },

  // --- Creed (4) ---
  {
    id: "q020",
    text: "I need to prove it to myself — that I'm not a mistake.",
    source: { name: "Adonis Creed", origin: "Creed (2015)" },
    category: "discipline",
    meaning:
      "The deepest discipline comes from needing to prove your worth to yourself, not to spectators. Make it personal.",
    tags: ["discipline", "mastery", "execution"],
  },
  {
    id: "q021",
    text: "If I fight, you fight. That's what we do. We fight together.",
    source: { name: "Adonis Creed", origin: "Creed II (2018)" },
    category: "discipline",
    meaning:
      "Discipline is not a solo endeavor. Commit to people who share your standards, and hold each other accountable.",
    tags: ["discipline", "connection", "consistency"],
  },
  {
    id: "q022",
    text: "I'm not running from anything anymore. I'm running toward what I want.",
    source: { name: "Adonis Creed", origin: "Creed III (2023)" },
    category: "discipline",
    meaning:
      "Shift from avoidance-based motivation to pursuit-based discipline. Chasing purpose produces more than fleeing fear.",
    tags: ["discipline", "momentum", "execution"],
  },
  {
    id: "q023",
    text: "You got everything to prove and nothing to lose. That's a dangerous fighter.",
    source: { name: "Adonis Creed", origin: "Creed (2015)" },
    category: "discipline",
    meaning:
      "When your back is against the wall, treat it as freedom. You're at your most dangerous when there's no fallback.",
    tags: ["discipline", "momentum", "resilience"],
  },

  // --- Jocko Willink (3) ---
  {
    id: "q024",
    text: "Discipline equals freedom.",
    source: { name: "Jocko Willink", origin: "Discipline Equals Freedom" },
    category: "discipline",
    meaning:
      "Constraints create capability. The daily structure you impose on yourself unlocks the freedom to do what matters.",
    tags: ["discipline", "consistency", "execution"],
  },
  {
    id: "q025",
    text: "Don't expect to be motivated every day. You have to learn to be disciplined.",
    source: { name: "Jocko Willink", origin: "Jocko Podcast" },
    category: "discipline",
    meaning:
      "Motivation is a weather pattern — it changes. Discipline is the foundation you build regardless of conditions.",
    tags: ["discipline", "consistency", "endurance"],
  },
  {
    id: "q026",
    text: "The more you practice, the better you get, the more freedom you have to create.",
    source: { name: "Jocko Willink", origin: "Discipline Equals Freedom" },
    category: "discipline",
    meaning:
      "Mastery through repetition opens creative doors. Drill the fundamentals until execution becomes effortless.",
    tags: ["discipline", "mastery", "momentum"],
  },

  // --- Marcus Aurelius (4) ---
  {
    id: "q027",
    text: "You have power over your mind, not outside events. Realize this, and you will find strength.",
    source: { name: "Marcus Aurelius", origin: "Meditations" },
    category: "discipline",
    meaning:
      "Focus your effort on what you can control: your responses, your preparation, your mindset. Release everything else.",
    tags: ["discipline", "mastery", "patience"],
  },
  {
    id: "q028",
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    source: { name: "Marcus Aurelius", origin: "Meditations" },
    category: "discipline",
    meaning:
      "Obstacles aren't detours — they're the training ground. Reframe every barrier as the exact challenge you need next.",
    tags: ["discipline", "resilience", "execution"],
  },
  {
    id: "q029",
    text: "Waste no more time arguing about what a good man should be. Be one.",
    source: { name: "Marcus Aurelius", origin: "Meditations" },
    category: "discipline",
    meaning:
      "Stop theorizing and start acting. The gap between knowing and doing is where most people stay forever.",
    tags: ["discipline", "execution", "consistency"],
  },
  {
    id: "q030",
    text: "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.",
    source: { name: "Marcus Aurelius", origin: "Meditations" },
    category: "discipline",
    meaning:
      "Your work isn't optional — it's your contribution to existence. Get up and do what you were designed to do.",
    tags: ["discipline", "consistency", "one-step"],
  },

  // ==========================================================================
  // RESPONSIBILITY (30 quotes)
  // Spider-Man (7), Captain America (8), Superman (5), Alfred Pennyworth (5),
  // Gandalf (5)
  // ==========================================================================

  // --- Spider-Man (7) ---
  {
    id: "q031",
    text: "With great power comes great responsibility.",
    source: { name: "Spider-Man", origin: "Amazing Fantasy #15" },
    category: "responsibility",
    meaning:
      "Every skill, resource, or advantage you have carries an obligation. Use what you've been given to serve more than yourself.",
    tags: ["discipline", "execution", "connection"],
  },
  {
    id: "q032",
    text: "When you can do the things that I can, but you don't, and then the bad things happen — they happen because of you.",
    source: { name: "Spider-Man", origin: "Captain America: Civil War" },
    category: "responsibility",
    meaning:
      "Inaction when you have ability is its own form of failure. Your capability creates your duty to act.",
    tags: ["execution", "discipline", "connection"],
  },
  {
    id: "q033",
    text: "No matter how many times I fall, I always find a reason to get back up — because someone's counting on me.",
    source: { name: "Spider-Man", origin: "Marvel Comics" },
    category: "responsibility",
    meaning:
      "When your own motivation fails, let the people depending on you pull you forward. Responsibility to others fuels recovery.",
    tags: ["recovery", "resilience", "connection"],
  },
  {
    id: "q034",
    text: "I can't always save everybody. But that doesn't mean I stop trying.",
    source: { name: "Spider-Man", origin: "Marvel Comics" },
    category: "responsibility",
    meaning:
      "Imperfect outcomes don't excuse you from effort. Keep showing up even when complete success isn't guaranteed.",
    tags: ["consistency", "resilience", "hope"],
  },
  {
    id: "q035",
    text: "Anyone can wear the mask. You can all be Spider-Man.",
    source: { name: "Spider-Man", origin: "Spider-Man: Into the Spider-Verse" },
    category: "responsibility",
    meaning:
      "Heroism isn't exclusive to the gifted. Taking responsibility is a choice available to everyone, right now.",
    tags: ["execution", "hope", "connection"],
  },
  {
    id: "q036",
    text: "The hardest part of this job is that you can't always be there. But you have to try.",
    source: { name: "Spider-Man", origin: "Marvel Comics" },
    category: "responsibility",
    meaning:
      "Accept that perfection is impossible while still giving maximum effort. The attempt itself matters.",
    tags: ["consistency", "endurance", "connection"],
  },
  {
    id: "q037",
    text: "If you keep worrying about what you can't control, you miss what you can.",
    source: { name: "Spider-Man", origin: "Marvel Comics" },
    category: "responsibility",
    meaning:
      "Redirect anxiety into action on the things within your reach. Responsibility starts with what's directly in front of you.",
    tags: ["execution", "discipline", "patience"],
  },

  // --- Captain America (8) ---
  {
    id: "q038",
    text: "I can do this all day.",
    source: { name: "Captain America", origin: "Captain America: The First Avenger" },
    category: "responsibility",
    meaning:
      "Commitment to what's right isn't conditional on comfort. Declare your willingness to endure as long as it takes.",
    tags: ["endurance", "resilience", "discipline"],
  },
  {
    id: "q039",
    text: "The price of freedom is high. It always has been. And it's a price I'm willing to pay.",
    source: { name: "Captain America", origin: "Captain America: The Winter Soldier" },
    category: "responsibility",
    meaning:
      "Accepting responsibility means accepting cost. Understand the sacrifice upfront and choose it willingly.",
    tags: ["discipline", "endurance", "execution"],
  },
  {
    id: "q040",
    text: "I don't want to kill anyone. I don't like bullies. I don't care where they're from.",
    source: { name: "Captain America", origin: "Captain America: The First Avenger" },
    category: "responsibility",
    meaning:
      "Stand against injustice regardless of context or convenience. Principles don't bend to circumstances.",
    tags: ["discipline", "consistency", "connection"],
  },
  {
    id: "q041",
    text: "If I see a situation pointed south, I can't ignore it. Sometimes I wish I could.",
    source: { name: "Captain America", origin: "Avengers: Age of Ultron" },
    category: "responsibility",
    meaning:
      "Responsibility is a burden you carry even when you'd rather look away. Seeing the problem obligates you to act.",
    tags: ["execution", "discipline", "connection"],
  },
  {
    id: "q042",
    text: "Even if the whole world is telling you to move, it is your duty to plant yourself like a tree and say 'No, you move.'",
    source: { name: "Captain America", origin: "Marvel Comics" },
    category: "responsibility",
    meaning:
      "When your principles are right, popular opinion is irrelevant. Stand firm when it matters most.",
    tags: ["discipline", "resilience", "endurance"],
  },
  {
    id: "q043",
    text: "The strong man who has known power all his life may lose respect for that power. But a weak man knows the value of strength.",
    source: { name: "Captain America", origin: "Captain America: The First Avenger" },
    category: "responsibility",
    meaning:
      "Those who've earned their strength through struggle wield it more wisely. Never forget where you came from.",
    tags: ["mastery", "patience", "discipline"],
  },
  {
    id: "q044",
    text: "I'm not looking for forgiveness, and I'm way past asking permission.",
    source: { name: "Captain America", origin: "Avengers: Infinity War" },
    category: "responsibility",
    meaning:
      "When you know what needs doing, don't wait for approval. Take ownership and act on conviction.",
    tags: ["execution", "momentum", "discipline"],
  },
  {
    id: "q045",
    text: "We don't trade lives. Every person matters.",
    source: { name: "Captain America", origin: "Avengers: Infinity War" },
    category: "responsibility",
    meaning:
      "True responsibility means valuing every individual. Don't take shortcuts that sacrifice someone else's wellbeing.",
    tags: ["connection", "discipline", "consistency"],
  },

  // --- Superman (5) ---
  {
    id: "q046",
    text: "You're going to change the world someday. For now, be patient.",
    source: { name: "Superman", origin: "Man of Steel" },
    category: "responsibility",
    meaning:
      "Your potential doesn't demand immediate explosion. Build capacity patiently; the moment for your full power will come.",
    tags: ["patience", "hope", "mastery"],
  },
  {
    id: "q047",
    text: "You will give the people of Earth an ideal to strive towards. They will stumble, they will fall. But in time, they will join you in the sun.",
    source: { name: "Jor-El", origin: "Man of Steel" },
    category: "responsibility",
    meaning:
      "Lead by example, not by force. Your consistent standard lifts everyone around you over time.",
    tags: ["hope", "consistency", "connection"],
  },
  {
    id: "q048",
    text: "There is a right and a wrong in this universe. And that distinction is not hard to make.",
    source: { name: "Superman", origin: "DC Comics" },
    category: "responsibility",
    meaning:
      "Don't overcomplicate moral decisions. Most of the time, you already know the right thing — just do it.",
    tags: ["execution", "discipline", "consistency"],
  },
  {
    id: "q049",
    text: "I'm here to fight for truth, and justice, and to help people who need it.",
    source: { name: "Superman", origin: "DC Comics" },
    category: "responsibility",
    meaning:
      "Reduce your mission to its simplest terms. When in doubt, return to the core: serve those who need help.",
    tags: ["connection", "execution", "consistency"],
  },
  {
    id: "q050",
    text: "The symbol of the House of El means hope. It's not just my family crest; it means something.",
    source: { name: "Superman", origin: "Man of Steel" },
    category: "responsibility",
    meaning:
      "What you represent matters to others. Your personal standards become a symbol that inspires beyond yourself.",
    tags: ["hope", "connection", "consistency"],
  },

  // --- Alfred Pennyworth (5) ---
  {
    id: "q051",
    text: "Why do we fall, sir? So that we can learn to pick ourselves up.",
    source: { name: "Alfred Pennyworth", origin: "Batman Begins" },
    category: "responsibility",
    meaning:
      "Failure is curriculum, not verdict. Each fall is training for the recovery that defines your character.",
    tags: ["recovery", "resilience", "patience"],
  },
  {
    id: "q052",
    text: "Some men aren't looking for anything logical. Some men just want to watch the world burn.",
    source: { name: "Alfred Pennyworth", origin: "The Dark Knight" },
    category: "responsibility",
    meaning:
      "Not every problem has a rational solution. Accept irrational forces and prepare for them instead of trying to reason them away.",
    tags: ["mastery", "resilience", "patience"],
  },
  {
    id: "q053",
    text: "Endure, Master Wayne. Take it. They'll hate you for it, but that's the point of Batman.",
    source: { name: "Alfred Pennyworth", origin: "The Dark Knight" },
    category: "responsibility",
    meaning:
      "Bearing misunderstanding is part of the cost. Responsible people endure criticism because the mission is more important than reputation.",
    tags: ["endurance", "resilience", "discipline"],
  },
  {
    id: "q054",
    text: "You care about justice? Look beyond your own pain, Bruce.",
    source: { name: "Alfred Pennyworth", origin: "Batman Begins" },
    category: "responsibility",
    meaning:
      "Self-pity is the enemy of responsibility. Zoom out from your personal suffering to see what the world actually needs from you.",
    tags: ["discipline", "connection", "execution"],
  },
  {
    id: "q055",
    text: "Perhaps it's time to stop trying to outsmart the truth and let it have its day.",
    source: { name: "Alfred Pennyworth", origin: "The Dark Knight Rises" },
    category: "responsibility",
    meaning:
      "Stop rationalizing and face reality. Responsibility begins with honesty — especially with yourself.",
    tags: ["discipline", "patience", "mastery"],
  },

  // --- Gandalf (5) ---
  {
    id: "q056",
    text: "All we have to decide is what to do with the time that is given to us.",
    source: { name: "Gandalf", origin: "The Lord of the Rings" },
    category: "responsibility",
    meaning:
      "You didn't choose your circumstances, but you choose your response. Focus all energy on how you'll use what you have.",
    tags: ["execution", "patience", "one-step"],
  },
  {
    id: "q057",
    text: "A wizard is never late, nor is he early. He arrives precisely when he means to.",
    source: { name: "Gandalf", origin: "The Lord of the Rings" },
    category: "responsibility",
    meaning:
      "Master your own timing. Don't rush or delay — move with intention and trust your process.",
    tags: ["patience", "discipline", "mastery"],
  },
  {
    id: "q058",
    text: "Many that live deserve death. And some that die deserve life. Can you give it to them? Do not be too eager to deal out death in judgment.",
    source: { name: "Gandalf", origin: "The Lord of the Rings" },
    category: "responsibility",
    meaning:
      "Withhold harsh judgment until you truly understand. Humility about your own limitations is a form of responsibility.",
    tags: ["patience", "mastery", "connection"],
  },
  {
    id: "q059",
    text: "It is not despair, for despair is only for those who see the end beyond all doubt. We do not.",
    source: { name: "Gandalf", origin: "The Lord of the Rings" },
    category: "responsibility",
    meaning:
      "You don't know the outcome, so despair is premature. Act responsibly in uncertainty — that's the definition of courage.",
    tags: ["hope", "resilience", "endurance"],
  },
  {
    id: "q060",
    text: "I will not say: do not weep; for not all tears are an evil.",
    source: { name: "Gandalf", origin: "The Lord of the Rings" },
    category: "responsibility",
    meaning:
      "Processing pain is not weakness — it's honest. Responsible strength includes allowing yourself to feel before moving forward.",
    tags: ["recovery", "patience", "connection"],
  },

  // ==========================================================================
  // PERSISTENCE (30 quotes)
  // Naruto (7), Luffy (5), Asta (3), Guts (4), Rock Lee (4), Might Guy (3),
  // Vegeta (4)
  // ==========================================================================

  // --- Naruto (7) ---
  {
    id: "q061",
    text: "I'm not gonna run away. I never go back on my word. That's my ninja way!",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Lock in your commitment publicly and refuse to break it. Your word to yourself is the most sacred contract.",
    tags: ["resilience", "endurance", "consistency"],
  },
  {
    id: "q062",
    text: "If you don't like the hand that fate's dealt you, fight for a new one.",
    source: { name: "Naruto Uzumaki", origin: "Naruto Shippuden" },
    category: "persistence",
    meaning:
      "Your starting conditions don't define your ending position. Fight to change what you were given.",
    tags: ["resilience", "momentum", "execution"],
  },
  {
    id: "q063",
    text: "When people are protecting something truly special to them, they truly can become as strong as they can be.",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Connect your persistence to something you love. Purpose-driven endurance unlocks strength that self-interest can't.",
    tags: ["connection", "endurance", "resilience"],
  },
  {
    id: "q064",
    text: "Failing doesn't give you a reason to give up, as long as you believe.",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Failure is data, not a death sentence. As long as your belief in the goal remains intact, every failure is just a lesson.",
    tags: ["hope", "resilience", "recovery"],
  },
  {
    id: "q065",
    text: "The pain of being alone is completely out of this world, isn't it? I don't know why, but I understand your feelings so much it actually hurts.",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Empathy born from personal struggle is your greatest connection tool. Your pain qualifies you to reach others.",
    tags: ["connection", "resilience", "hope"],
  },
  {
    id: "q066",
    text: "Hard work is worthless for those that don't believe in themselves.",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Self-belief is the prerequisite for productive effort. Without it, every hour of work leaks energy. Build belief first.",
    tags: ["mastery", "momentum", "discipline"],
  },
  {
    id: "q067",
    text: "I'll acknowledge that you're strong, but I will never accept that I'm weak.",
    source: { name: "Naruto Uzumaki", origin: "Naruto Shippuden" },
    category: "persistence",
    meaning:
      "Respect your competition without diminishing yourself. You can admire others while maintaining unshakable self-worth.",
    tags: ["resilience", "mastery", "endurance"],
  },

  // --- Luffy (5) ---
  {
    id: "q068",
    text: "I don't want to conquer anything. I just think the guy with the most freedom in this whole ocean is the Pirate King.",
    source: { name: "Monkey D. Luffy", origin: "One Piece" },
    category: "persistence",
    meaning:
      "Redefine success as freedom, not domination. Persist toward a life where you get to be fully yourself.",
    tags: ["momentum", "hope", "execution"],
  },
  {
    id: "q069",
    text: "If you don't take risks, you can't create a future.",
    source: { name: "Monkey D. Luffy", origin: "One Piece" },
    category: "persistence",
    meaning:
      "Playing it safe guarantees stagnation. Persistence requires the courage to bet on uncertain outcomes.",
    tags: ["execution", "momentum", "resilience"],
  },
  {
    id: "q070",
    text: "I will be the Pirate King! That's not a dream — that's my declaration.",
    source: { name: "Monkey D. Luffy", origin: "One Piece" },
    category: "persistence",
    meaning:
      "Elevate your goal from a wish to a statement of intent. Declarations carry weight that dreams alone don't.",
    tags: ["execution", "momentum", "discipline"],
  },
  {
    id: "q071",
    text: "I've set myself to become the King of the Pirates, and if I die trying, then at least I tried!",
    source: { name: "Monkey D. Luffy", origin: "One Piece" },
    category: "persistence",
    meaning:
      "Accept the ultimate downside and proceed anyway. When you've made peace with the worst case, nothing can stop you.",
    tags: ["resilience", "endurance", "execution"],
  },
  {
    id: "q072",
    text: "I don't care what the world says about me. I'll keep moving forward because that's who I am.",
    source: { name: "Monkey D. Luffy", origin: "One Piece" },
    category: "persistence",
    meaning:
      "External opinions are noise. Persistence means forward motion regardless of what the crowd thinks.",
    tags: ["endurance", "momentum", "resilience"],
  },

  // --- Asta (3) ---
  {
    id: "q073",
    text: "I'll surpass my limits right here, right now!",
    source: { name: "Asta", origin: "Black Clover" },
    category: "persistence",
    meaning:
      "Don't wait for ideal conditions to push beyond your ceiling. The moment to exceed yourself is always the present one.",
    tags: ["execution", "momentum", "endurance"],
  },
  {
    id: "q074",
    text: "Not giving up is my magic!",
    source: { name: "Asta", origin: "Black Clover" },
    category: "persistence",
    meaning:
      "When you lack natural talent, relentless persistence becomes your unfair advantage. Make stubbornness your superpower.",
    tags: ["resilience", "endurance", "consistency"],
  },
  {
    id: "q075",
    text: "No matter how tough the situation is, I'll never stop. Because that's the kind of person I want to be.",
    source: { name: "Asta", origin: "Black Clover" },
    category: "persistence",
    meaning:
      "Tie your persistence to identity, not to outcomes. When 'never stopping' is who you are, quitting becomes impossible.",
    tags: ["endurance", "resilience", "consistency"],
  },

  // --- Guts (4) ---
  {
    id: "q076",
    text: "If you're always worried about crushing the ants beneath you, you won't be able to walk.",
    source: { name: "Guts", origin: "Berserk" },
    category: "persistence",
    meaning:
      "Overthinking every small consequence creates paralysis. Move forward and handle problems as they arise.",
    tags: ["execution", "momentum", "endurance"],
  },
  {
    id: "q077",
    text: "Even if we painstakingly piece together something lost, it doesn't mean things will ever go back to how they were.",
    source: { name: "Guts", origin: "Berserk" },
    category: "persistence",
    meaning:
      "Accept that some changes are permanent. Persistence isn't about restoring the past — it's about forging forward despite loss.",
    tags: ["resilience", "recovery", "endurance"],
  },
  {
    id: "q078",
    text: "I'll fight. I'll keep fighting. No matter how hopeless things seem.",
    source: { name: "Guts", origin: "Berserk" },
    category: "persistence",
    meaning:
      "When hope is gone, fight anyway. The act of fighting itself creates meaning where none exists.",
    tags: ["endurance", "resilience", "execution"],
  },
  {
    id: "q079",
    text: "My place really was here. I was too foolish and stubborn to notice.",
    source: { name: "Guts", origin: "Berserk" },
    category: "persistence",
    meaning:
      "Sometimes persistence reveals that what you were seeking was already present. Stay alert to what's right in front of you.",
    tags: ["patience", "connection", "mastery"],
  },

  // --- Rock Lee (4) ---
  {
    id: "q080",
    text: "A genius of hard work — that is who I am.",
    source: { name: "Rock Lee", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Redefine genius. You don't need natural talent when you can out-work everyone. Effort is your form of brilliance.",
    tags: ["mastery", "endurance", "consistency"],
  },
  {
    id: "q081",
    text: "If I can't do 400 push-ups, I'll do 800 squats. If I can't do 800 squats, I'll do 1500 reps with the jump rope.",
    source: { name: "Rock Lee", origin: "Naruto" },
    category: "persistence",
    meaning:
      "When one path is blocked, find another way to train. Never let a single obstacle become a total excuse.",
    tags: ["execution", "consistency", "endurance"],
  },
  {
    id: "q082",
    text: "I will prove that hard work can surpass natural talent.",
    source: { name: "Rock Lee", origin: "Naruto" },
    category: "persistence",
    meaning:
      "The gifted coast; the persistent compound. Over a long enough timeline, consistent effort beats sporadic talent.",
    tags: ["mastery", "endurance", "consistency"],
  },
  {
    id: "q083",
    text: "A rock cannot be polished without friction, and a person cannot be perfected without trials.",
    source: { name: "Rock Lee", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Difficulty is the polishing process. Embrace resistance as the very thing that shapes you into something valuable.",
    tags: ["resilience", "mastery", "patience"],
  },

  // --- Might Guy (3) ---
  {
    id: "q084",
    text: "The power of youth is the power of hard work and dedication!",
    source: { name: "Might Guy", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Energy without direction fizzles out. Channel your vitality into dedicated, structured effort for maximum impact.",
    tags: ["momentum", "execution", "consistency"],
  },
  {
    id: "q085",
    text: "It doesn't matter if you have talent or not. What matters is whether you work hard enough to bloom.",
    source: { name: "Might Guy", origin: "Naruto" },
    category: "persistence",
    meaning:
      "Talent determines your starting point but effort determines your ceiling. Work until you bloom regardless of where you began.",
    tags: ["mastery", "endurance", "consistency"],
  },
  {
    id: "q086",
    text: "When you protect the ones you love, you become genuinely strong.",
    source: { name: "Might Guy", origin: "Naruto Shippuden" },
    category: "persistence",
    meaning:
      "Tether your persistence to the people who matter. Fighting for others unlocks strength you can't access for yourself alone.",
    tags: ["connection", "endurance", "resilience"],
  },

  // --- Vegeta (4) ---
  {
    id: "q087",
    text: "I do not need to be saved. I can fight my own battles.",
    source: { name: "Vegeta", origin: "Dragon Ball Z" },
    category: "persistence",
    meaning:
      "Self-reliance is earned through consistent effort. Build enough capability that you never need a rescue.",
    tags: ["mastery", "endurance", "discipline"],
  },
  {
    id: "q088",
    text: "Push through the pain. Giving up hurts more.",
    source: { name: "Vegeta", origin: "Dragon Ball Z" },
    category: "persistence",
    meaning:
      "The regret of quitting always exceeds the pain of continuing. When you're hurting, remember that stopping hurts longer.",
    tags: ["endurance", "resilience", "execution"],
  },
  {
    id: "q089",
    text: "Every time you try to cut me down, I grow back stronger.",
    source: { name: "Vegeta", origin: "Dragon Ball Z" },
    category: "persistence",
    meaning:
      "Treat defeat as fuel for adaptation. Every loss should trigger a training response that makes you harder to beat next time.",
    tags: ["resilience", "recovery", "momentum"],
  },
  {
    id: "q090",
    text: "I will not be surpassed by a clown like you. My pride demands that I keep fighting!",
    source: { name: "Vegeta", origin: "Dragon Ball Z" },
    category: "persistence",
    meaning:
      "Competitive pride, channeled properly, is rocket fuel. Use it to refuse mediocrity and demand more from yourself.",
    tags: ["momentum", "endurance", "mastery"],
  },

  // ==========================================================================
  // LEADERSHIP (30 quotes)
  // Aragorn (6), Optimus Prime (5), Erwin Smith (6), Levi Ackerman (5),
  // Charles Xavier (4), Dumbledore (4)
  // ==========================================================================

  // --- Aragorn (6) ---
  {
    id: "q091",
    text: "I do not know what strength is in my blood, but I swear to you I will not let the White City fall.",
    source: { name: "Aragorn", origin: "The Lord of the Rings" },
    category: "leadership",
    meaning:
      "You don't need certainty in your abilities to make commitments. Lead by pledging everything you have, whatever that turns out to be.",
    tags: ["execution", "endurance", "hope"],
  },
  {
    id: "q092",
    text: "There is always hope.",
    source: { name: "Aragorn", origin: "The Lord of the Rings" },
    category: "leadership",
    meaning:
      "A leader's first job is to maintain possibility when everyone else has abandoned it. Your conviction becomes the team's fuel.",
    tags: ["hope", "resilience", "connection"],
  },
  {
    id: "q093",
    text: "A day may come when the courage of Men fails, when we forsake our friends and break all bonds of fellowship. But it is not this day.",
    source: { name: "Aragorn", origin: "The Lord of the Rings" },
    category: "leadership",
    meaning:
      "Rally people by defining what today demands. Acknowledge the possibility of failure, then declare that today is not that day.",
    tags: ["hope", "execution", "connection"],
  },
  {
    id: "q094",
    text: "I am Aragorn, son of Arathorn, and if by life or death I can save you, I will.",
    source: { name: "Aragorn", origin: "The Lord of the Rings" },
    category: "leadership",
    meaning:
      "State who you are and what you're willing to sacrifice. Clear commitment earns trust faster than credentials.",
    tags: ["execution", "connection", "endurance"],
  },
  {
    id: "q095",
    text: "Gentlemen, we do not stop till nightfall.",
    source: { name: "Aragorn", origin: "The Lord of the Rings" },
    category: "leadership",
    meaning:
      "Set the pace and hold it. A leader defines the standard of effort through their own relentless example.",
    tags: ["discipline", "momentum", "execution"],
  },
  {
    id: "q096",
    text: "I see in your eyes the same fear that would take the heart of me. But today, I ask you to stand and fight!",
    source: { name: "Aragorn", origin: "The Lord of the Rings" },
    category: "leadership",
    meaning:
      "Admit you share the same fears as your team. Vulnerability combined with a call to action creates authentic leadership.",
    tags: ["connection", "hope", "execution"],
  },

  // --- Optimus Prime (5) ---
  {
    id: "q097",
    text: "Freedom is the right of all sentient beings.",
    source: { name: "Optimus Prime", origin: "Transformers" },
    category: "leadership",
    meaning:
      "Lead with universal principles, not personal advantage. The strongest leaders fight for rights that extend beyond themselves.",
    tags: ["hope", "connection", "discipline"],
  },
  {
    id: "q098",
    text: "Fate rarely calls upon us at a moment of our choosing.",
    source: { name: "Optimus Prime", origin: "Transformers: Revenge of the Fallen" },
    category: "leadership",
    meaning:
      "You won't get to pick when you're needed most. Stay prepared so that when the moment arrives, you're ready to lead.",
    tags: ["discipline", "mastery", "execution"],
  },
  {
    id: "q099",
    text: "There's a thin line between being a hero and being a memory.",
    source: { name: "Optimus Prime", origin: "Transformers" },
    category: "leadership",
    meaning:
      "Bold leadership means operating at the edge of risk. Accept the danger but prepare meticulously to survive it.",
    tags: ["execution", "resilience", "mastery"],
  },
  {
    id: "q100",
    text: "We can be heroes in our own lives, every one of us, if we only have the courage to try.",
    source: { name: "Optimus Prime", origin: "Transformers" },
    category: "leadership",
    meaning:
      "Leadership starts with the courage of personal initiative. You don't need a title — just the willingness to step forward.",
    tags: ["hope", "execution", "momentum"],
  },
  {
    id: "q101",
    text: "In any war, there are calms between storms. There will be days when we lose faith. But the day will never come that we forsake this planet.",
    source: { name: "Optimus Prime", origin: "Transformers: Dark of the Moon" },
    category: "leadership",
    meaning:
      "Losing faith temporarily is human. The leadership commitment is to never abandon the mission regardless of emotional weather.",
    tags: ["endurance", "resilience", "hope"],
  },

  // --- Erwin Smith (6) ---
  {
    id: "q102",
    text: "If we only focus on making the best moves, we will never get the better of our opponent.",
    source: { name: "Erwin Smith", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Safe plays lose against formidable odds. Sometimes leadership means choosing the unconventional move that nobody expects.",
    tags: ["execution", "momentum", "mastery"],
  },
  {
    id: "q103",
    text: "The only thing we're allowed to do is believe that we won't regret the choice we made.",
    source: { name: "Erwin Smith", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "In uncertainty, commit fully to your decision. Post-decision doubt is wasted energy — invest in execution instead.",
    tags: ["execution", "discipline", "resilience"],
  },
  {
    id: "q104",
    text: "If you begin to regret, you'll dull your future decisions and let others make your choices for you.",
    source: { name: "Erwin Smith", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Regret weakens your decision-making muscle. Learn from mistakes but never let them paralyze your next choice.",
    tags: ["execution", "momentum", "mastery"],
  },
  {
    id: "q105",
    text: "My soldiers, rage! My soldiers, scream! My soldiers, fight!",
    source: { name: "Erwin Smith", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "In the darkest moment, a leader's voice becomes the spark. Channel collective emotion into unified action.",
    tags: ["momentum", "execution", "endurance"],
  },
  {
    id: "q106",
    text: "Someone who cannot sacrifice anything can never change anything.",
    source: { name: "Erwin Smith", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Change demands cost. If you're unwilling to give something up, you're unable to create something new.",
    tags: ["discipline", "execution", "resilience"],
  },
  {
    id: "q107",
    text: "I will keep moving forward until all my enemies are destroyed.",
    source: { name: "Erwin Smith", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Define your obstacles clearly and advance against them without hesitation. Forward momentum is the leader's default state.",
    tags: ["momentum", "endurance", "execution"],
  },

  // --- Levi Ackerman (5) ---
  {
    id: "q108",
    text: "The only thing we can do is keep moving forward and make a choice we won't regret.",
    source: { name: "Levi Ackerman", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Perfection is impossible in real decisions. Choose the option you can live with and execute it without looking back.",
    tags: ["execution", "momentum", "discipline"],
  },
  {
    id: "q109",
    text: "Give up on your dreams and die. Lead the new recruits straight into hell. I will take down the Beast Titan.",
    source: { name: "Levi Ackerman", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Real leadership sometimes means absorbing the heaviest burden yourself so others can fulfill their part. Take the hardest job.",
    tags: ["execution", "endurance", "discipline"],
  },
  {
    id: "q110",
    text: "I don't know which option you should choose. I never have. No matter how strong I become, the decisions are still yours.",
    source: { name: "Levi Ackerman", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "True leadership means empowering others to own their choices. Strength doesn't mean deciding for everyone.",
    tags: ["connection", "mastery", "patience"],
  },
  {
    id: "q111",
    text: "Make a choice that you'll be proud of. Trust yourself.",
    source: { name: "Levi Ackerman", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Self-trust is the foundation of decisive action. Build it through small commitments honored consistently.",
    tags: ["discipline", "consistency", "mastery"],
  },
  {
    id: "q112",
    text: "Clean every corner of every room until it shines. That's how you build a life you can stand to live in.",
    source: { name: "Levi Ackerman", origin: "Attack on Titan" },
    category: "leadership",
    meaning:
      "Excellence in small details compounds into an environment worth being proud of. Mastery starts with the mundane.",
    tags: ["consistency", "mastery", "discipline"],
  },

  // --- Charles Xavier (4) ---
  {
    id: "q113",
    text: "Just because someone stumbles and loses their path, doesn't mean they can't be saved.",
    source: { name: "Charles Xavier", origin: "X-Men: Days of Future Past" },
    category: "leadership",
    meaning:
      "Never write people off after a failure. A leader sees potential in others even when they can't see it themselves.",
    tags: ["hope", "connection", "recovery"],
  },
  {
    id: "q114",
    text: "The greatest power on Earth is the magnificent power we all of us possess: the power of the human brain.",
    source: { name: "Charles Xavier", origin: "X-Men" },
    category: "leadership",
    meaning:
      "Your mind is your primary weapon. Invest in thinking clearly before acting forcefully.",
    tags: ["mastery", "patience", "discipline"],
  },
  {
    id: "q115",
    text: "I have been trying to control you since the day we met, and look where that's gotten us.",
    source: { name: "Charles Xavier", origin: "X-Men: Apocalypse" },
    category: "leadership",
    meaning:
      "Control-based leadership eventually fails. Shift to influence-based leadership — inspire rather than command.",
    tags: ["connection", "patience", "mastery"],
  },
  {
    id: "q116",
    text: "Mutation — it is the key to our evolution. It has enabled us to evolve from a single-celled organism into the dominant species on the planet.",
    source: { name: "Charles Xavier", origin: "X-Men" },
    category: "leadership",
    meaning:
      "Difference is not a defect — it's an evolutionary advantage. Lead by celebrating and leveraging what makes people unique.",
    tags: ["hope", "connection", "mastery"],
  },

  // --- Dumbledore (4) ---
  {
    id: "q117",
    text: "It does not do to dwell on dreams and forget to live.",
    source: { name: "Albus Dumbledore", origin: "Harry Potter" },
    category: "leadership",
    meaning:
      "Planning without execution is just fantasy. A leader balances vision with present-moment action.",
    tags: ["execution", "patience", "one-step"],
  },
  {
    id: "q118",
    text: "It is our choices that show what we truly are, far more than our abilities.",
    source: { name: "Albus Dumbledore", origin: "Harry Potter" },
    category: "leadership",
    meaning:
      "Leadership is defined by decisions, not talent. The choices you make under pressure reveal your true character.",
    tags: ["discipline", "execution", "mastery"],
  },
  {
    id: "q119",
    text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
    source: { name: "Albus Dumbledore", origin: "Harry Potter" },
    category: "leadership",
    meaning:
      "In crisis, a leader's job is to create light — even a small one. One positive action shifts the entire atmosphere.",
    tags: ["hope", "one-step", "resilience"],
  },
  {
    id: "q120",
    text: "It takes a great deal of bravery to stand up to our enemies, but just as much to stand up to our friends.",
    source: { name: "Albus Dumbledore", origin: "Harry Potter" },
    category: "leadership",
    meaning:
      "Holding allies accountable requires more courage than fighting opponents. Real leadership means honest feedback to those you care about.",
    tags: ["discipline", "connection", "mastery"],
  },

  // ==========================================================================
  // GROWTH (30 quotes)
  // Uncle Iroh (8), All Might (5), APJ Abdul Kalam (5), David Goggins (5),
  // Kakashi (3), Whitebeard (4)
  // ==========================================================================

  // --- Uncle Iroh (8) ---
  {
    id: "q121",
    text: "It is usually best to admit mistakes when they occur, and to seek to restore honor.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Growth begins with owning your errors quickly. Speed of acknowledgment determines speed of recovery.",
    tags: ["recovery", "discipline", "mastery"],
  },
  {
    id: "q122",
    text: "Pride is not the opposite of shame, but its source. True humility is the only antidote to shame.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Excessive pride creates vulnerability to shame. Humility protects you from emotional extremes and enables steady growth.",
    tags: ["patience", "mastery", "resilience"],
  },
  {
    id: "q123",
    text: "You must never give into despair. Allow yourself to slip down that road, and you surrender to your lowest instincts.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Despair is a choice that feels like a fact. Reject it actively by doing one constructive thing immediately.",
    tags: ["resilience", "recovery", "one-step"],
  },
  {
    id: "q124",
    text: "While it is always best to believe in oneself, a little help from others can be a great blessing.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Self-reliance and accepting help aren't contradictions. Grow faster by combining personal effort with communal support.",
    tags: ["connection", "mastery", "hope"],
  },
  {
    id: "q125",
    text: "Sometimes life is like this dark tunnel. You can't always see the light at the end, but if you keep moving, you will come to a better place.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Visibility isn't required for progress. Move forward even when you can't see the outcome — movement itself creates clarity.",
    tags: ["one-step", "hope", "endurance"],
  },
  {
    id: "q126",
    text: "Failure is only the opportunity to begin again, only this time more wisely.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Every failure installs new knowledge. Treat restarts as upgrades, not setbacks — version 2.0 is always better.",
    tags: ["recovery", "mastery", "momentum"],
  },
  {
    id: "q127",
    text: "Protection and power are overrated. I think you are very wise to choose happiness and love.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Growth isn't always about becoming stronger. Sometimes the bravest growth is choosing peace, love, and contentment over ambition.",
    tags: ["connection", "patience", "hope"],
  },
  {
    id: "q128",
    text: "You are not the man you used to be. You are stronger and wiser and freer than you have ever been. And now you have come to the crossroads of your destiny.",
    source: { name: "Uncle Iroh", origin: "Avatar: The Last Airbender" },
    category: "growth",
    meaning:
      "Acknowledge your own progress before the next challenge. You're better equipped now than ever — trust your growth.",
    tags: ["mastery", "hope", "momentum"],
  },

  // --- All Might (5) ---
  {
    id: "q129",
    text: "It's fine now. Why? Because I am here!",
    source: { name: "All Might", origin: "My Hero Academia" },
    category: "growth",
    meaning:
      "Grow to the point where your presence itself reassures others. Become the person who makes everything feel solvable.",
    tags: ["hope", "connection", "mastery"],
  },
  {
    id: "q130",
    text: "The most inflated egos are often the most fragile. True strength comes from knowing your weaknesses.",
    source: { name: "All Might", origin: "My Hero Academia" },
    category: "growth",
    meaning:
      "Self-awareness is the foundation of genuine strength. Map your weaknesses honestly to grow where it matters most.",
    tags: ["mastery", "patience", "discipline"],
  },
  {
    id: "q131",
    text: "When there's nothing to be gained, rising to the challenge at those times is surely the mark of a true hero.",
    source: { name: "All Might", origin: "My Hero Academia" },
    category: "growth",
    meaning:
      "Growing past self-interest is the ultimate level-up. Act without reward, and you become the person you aspire to be.",
    tags: ["discipline", "consistency", "connection"],
  },
  {
    id: "q132",
    text: "You can become a hero.",
    source: { name: "All Might", origin: "My Hero Academia" },
    category: "growth",
    meaning:
      "Sometimes the most transformative moment is someone believing in you before you believe in yourself. Be that person for others.",
    tags: ["hope", "connection", "momentum"],
  },
  {
    id: "q133",
    text: "Now it's your turn. You're next.",
    source: { name: "All Might", origin: "My Hero Academia" },
    category: "growth",
    meaning:
      "Every mentor reaches the moment of passing the torch. Growth means accepting that your role is to elevate successors.",
    tags: ["connection", "mastery", "hope"],
  },

  // --- APJ Abdul Kalam (5) ---
  {
    id: "q134",
    text: "Dream is not that which you see while sleeping. It is something that does not let you sleep.",
    source: { name: "APJ Abdul Kalam", origin: "Wings of Fire" },
    category: "growth",
    meaning:
      "A real vision keeps you restless until you act on it. If it doesn't disturb your comfort, it's not a real dream.",
    tags: ["momentum", "execution", "mastery"],
  },
  {
    id: "q135",
    text: "If you want to shine like a sun, first burn like a sun.",
    source: { name: "APJ Abdul Kalam", origin: "Wings of Fire" },
    category: "growth",
    meaning:
      "Visible excellence requires invisible burning effort. The glow people admire is the residue of relentless internal work.",
    tags: ["endurance", "mastery", "discipline"],
  },
  {
    id: "q136",
    text: "Failure will never overtake me if my determination to succeed is strong enough.",
    source: { name: "APJ Abdul Kalam", origin: "Wings of Fire" },
    category: "growth",
    meaning:
      "Determination is armor against failure. When resolve exceeds difficulty, no setback becomes permanent.",
    tags: ["resilience", "endurance", "momentum"],
  },
  {
    id: "q137",
    text: "Don't take rest after your first victory, because if you fail in the second, more lips are waiting to say that your first victory was just luck.",
    source: { name: "APJ Abdul Kalam", origin: "Wings of Fire" },
    category: "growth",
    meaning:
      "One success proves nothing. Sustain your effort through multiple wins to convert luck into undeniable pattern.",
    tags: ["consistency", "momentum", "execution"],
  },
  {
    id: "q138",
    text: "You have to dream before your dreams can come true.",
    source: { name: "APJ Abdul Kalam", origin: "Wings of Fire" },
    category: "growth",
    meaning:
      "Visualization precedes realization. Invest time in imagining the specific future you want — then build toward it.",
    tags: ["hope", "execution", "one-step"],
  },

  // --- David Goggins (5) ---
  {
    id: "q139",
    text: "We live in an external world. Everything we need to be happy is inside us — it's the internal work that matters.",
    source: { name: "David Goggins", origin: "Can't Hurt Me" },
    category: "growth",
    meaning:
      "External achievements without internal development leave you hollow. Prioritize the mental and emotional work.",
    tags: ["mastery", "discipline", "patience"],
  },
  {
    id: "q140",
    text: "You are in danger of living a life so comfortable and soft that you will die without ever realizing your potential.",
    source: { name: "David Goggins", origin: "Can't Hurt Me" },
    category: "growth",
    meaning:
      "Comfort is the silent killer of growth. Deliberately seek discomfort to unlock capability you didn't know existed.",
    tags: ["momentum", "execution", "endurance"],
  },
  {
    id: "q141",
    text: "The only person who was going to turn my life around was me. The only way I could get turned around was to put myself through the worst things possible.",
    source: { name: "David Goggins", origin: "Can't Hurt Me" },
    category: "growth",
    meaning:
      "Nobody is coming to save you. Growth requires self-imposed difficulty — choose your hard rather than waiting for it.",
    tags: ["discipline", "execution", "resilience"],
  },
  {
    id: "q142",
    text: "When you think you're done, you're only at forty percent of your actual potential.",
    source: { name: "David Goggins", origin: "Can't Hurt Me" },
    category: "growth",
    meaning:
      "Your brain quits long before your body or mind truly must. Push past the initial quit signal — massive capacity remains.",
    tags: ["endurance", "momentum", "resilience"],
  },
  {
    id: "q143",
    text: "Motivation is a bath. You have to take one every day. It doesn't last. That's why I rely on discipline and a calloused mind.",
    source: { name: "David Goggins", origin: "Can't Hurt Me" },
    category: "growth",
    meaning:
      "Build mental callouses through repeated exposure to difficulty. A toughened mind doesn't need external motivation to function.",
    tags: ["discipline", "consistency", "mastery"],
  },

  // --- Kakashi (3) ---
  {
    id: "q144",
    text: "In the ninja world, those who break the rules are scum, but those who abandon their friends are worse than scum.",
    source: { name: "Kakashi Hatake", origin: "Naruto" },
    category: "growth",
    meaning:
      "Growth includes learning that systems serve people, not the reverse. Never sacrifice relationships for rules.",
    tags: ["connection", "discipline", "mastery"],
  },
  {
    id: "q145",
    text: "Whether you have a problem or not, people have different limits. And you can't just give someone more than they can handle.",
    source: { name: "Kakashi Hatake", origin: "Naruto" },
    category: "growth",
    meaning:
      "Know your capacity and build it gradually. Sustainable growth respects current limits while steadily expanding them.",
    tags: ["patience", "mastery", "consistency"],
  },
  {
    id: "q146",
    text: "The hole in one's heart is filled by others around you. That is what friends are for.",
    source: { name: "Kakashi Hatake", origin: "Naruto Shippuden" },
    category: "growth",
    meaning:
      "Personal growth isn't purely internal. Healing and development happen through genuine connection with others.",
    tags: ["connection", "recovery", "hope"],
  },

  // --- Whitebeard (4) ---
  {
    id: "q147",
    text: "Even in death, my body shall not fall. My heart beats like a drum of war, and I will fight standing.",
    source: { name: "Whitebeard", origin: "One Piece" },
    category: "growth",
    meaning:
      "Grow your resolve to the point where even final moments are spent standing tall. Build the character that doesn't break.",
    tags: ["endurance", "resilience", "discipline"],
  },
  {
    id: "q148",
    text: "Family doesn't have to be blood. The people you choose to protect — they're your real treasure.",
    source: { name: "Whitebeard", origin: "One Piece" },
    category: "growth",
    meaning:
      "Growth means expanding your definition of family. Build bonds by choosing to protect people, not by waiting for shared DNA.",
    tags: ["connection", "hope", "consistency"],
  },
  {
    id: "q149",
    text: "A man's dream will never die! As long as people continue to pursue the meaning of freedom, these things will never cease to be!",
    source: { name: "Whitebeard", origin: "One Piece" },
    category: "growth",
    meaning:
      "Your dreams outlive your limitations. Keep pursuing freedom and meaning — they create ripple effects beyond your own life.",
    tags: ["hope", "momentum", "endurance"],
  },
  {
    id: "q150",
    text: "I don't need a treasure. I've already got everything I could ever want — a family.",
    source: { name: "Whitebeard", origin: "One Piece" },
    category: "growth",
    meaning:
      "The ultimate growth insight: what you've been chasing may already be in your hands. Recognize the wealth of human connection.",
    tags: ["connection", "hope", "patience"],
  },

  // ==========================================================================
  // BONUS ANIME QUOTES (30)
  // ==========================================================================

  // ── Discipline ─────────────────────────────────────────────────

  {
    id: "q151",
    text: "A lesson without pain is meaningless. You cannot gain something without sacrificing something in return.",
    source: { name: "Edward Elric", origin: "Fullmetal Alchemist: Brotherhood" },
    category: "discipline",
    meaning: "Equivalent exchange applies to growth. Every skill, every result, costs effort. Pay the price willingly.",
    tags: ["discipline", "mastery", "endurance"],
  },
  {
    id: "q152",
    text: "If you don't take risks, you can't create a future.",
    source: { name: "Monkey D. Luffy", origin: "One Piece" },
    category: "discipline",
    meaning: "Safety produces stagnation. Every meaningful outcome requires stepping beyond the known.",
    tags: ["discipline", "execution", "momentum"],
  },
  {
    id: "q153",
    text: "Power comes in response to a need, not a desire. You have to create that need.",
    source: { name: "Goku", origin: "Dragon Ball Z" },
    category: "discipline",
    meaning: "Growth follows pressure, not wishing. Put yourself in situations that demand you become stronger.",
    tags: ["discipline", "mastery", "execution"],
  },
  {
    id: "q154",
    text: "The world is not beautiful, therefore it is.",
    source: { name: "Kino", origin: "Kino's Journey" },
    category: "discipline",
    meaning: "Accepting imperfection is what reveals the real beauty in effort, in struggle, in the attempt itself.",
    tags: ["discipline", "patience", "mastery"],
  },
  {
    id: "q155",
    text: "Knowing what it feels like to be in pain is exactly why we try to be kind to others.",
    source: { name: "Jiraiya", origin: "Naruto Shippuden" },
    category: "discipline",
    meaning: "Your pain is not wasted. It becomes the source code for empathy. Channel suffering into service.",
    tags: ["discipline", "connection", "resilience"],
  },
  {
    id: "q156",
    text: "If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be.",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "discipline",
    meaning: "Circumstance is the starting hand, not the final score. Rewrite the script through relentless action.",
    tags: ["discipline", "execution", "resilience"],
  },

  // ── Responsibility ─────────────────────────────────────────────

  {
    id: "q157",
    text: "The only ones who should kill are those prepared to be killed.",
    source: { name: "Lelouch", origin: "Code Geass" },
    category: "responsibility",
    meaning: "Before demanding sacrifice from others, accept the same cost yourself. Lead from the front.",
    tags: ["discipline", "execution", "mastery"],
  },
  {
    id: "q158",
    text: "A person grows up when he's able to overcome hardships. Protection is important, but there are some things a person must learn on their own.",
    source: { name: "Jiraiya", origin: "Naruto Shippuden" },
    category: "responsibility",
    meaning: "You cannot shield someone from every lesson. Some growth requires direct confrontation with difficulty.",
    tags: ["resilience", "patience", "mastery"],
  },
  {
    id: "q159",
    text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.",
    source: { name: "Kenshin Himura", origin: "Rurouni Kenshin" },
    category: "responsibility",
    meaning: "Loss is recoverable. Deliberate abandonment is permanent. Guard what matters; don't discard it carelessly.",
    tags: ["discipline", "consistency", "connection"],
  },
  {
    id: "q160",
    text: "People's lives don't end when they die. It ends when they lose faith.",
    source: { name: "Itachi Uchiha", origin: "Naruto Shippuden" },
    category: "responsibility",
    meaning: "The real death is the surrender of belief. As long as conviction holds, you are alive in the ways that matter.",
    tags: ["hope", "resilience", "endurance"],
  },
  {
    id: "q161",
    text: "Those who stand at the top determine what's wrong and what's right. This very place is neutral ground. Justice will prevail, you say? Of course it will. Because whoever wins this war becomes justice.",
    source: { name: "Donquixote Doflamingo", origin: "One Piece" },
    category: "responsibility",
    meaning: "Morality is not automatic. It requires people willing to fight for it. If you want justice, become it.",
    tags: ["execution", "discipline", "mastery"],
  },
  {
    id: "q162",
    text: "It's not about whether I can. I have to do it.",
    source: { name: "Tanjiro Kamado", origin: "Demon Slayer" },
    category: "responsibility",
    meaning: "Capability is irrelevant when the stakes demand action. Obligation overrides readiness.",
    tags: ["execution", "discipline", "endurance"],
  },

  // ── Persistence ────────────────────────────────────────────────

  {
    id: "q163",
    text: "If you can still stand, if you can still move, then you can't give up.",
    source: { name: "Tanjirou Kamado", origin: "Demon Slayer" },
    category: "persistence",
    meaning: "The body decides the limit, not the mind. If your body can still function, your mind has no right to quit.",
    tags: ["endurance", "resilience", "discipline"],
  },
  {
    id: "q164",
    text: "Giving up kills people. When people reject giving up, they finally win the right to transcend humanity.",
    source: { name: "Alucard", origin: "Hellsing" },
    category: "persistence",
    meaning: "The act of refusing to stop is itself a transcendent ability. Most people quit. You don't have to.",
    tags: ["endurance", "discipline", "mastery"],
  },
  {
    id: "q165",
    text: "I am the hope of the universe. I am the answer to all living things that cry out for peace.",
    source: { name: "Goku", origin: "Dragon Ball Z" },
    category: "persistence",
    meaning: "When you fully accept your role, hesitation disappears. Own your purpose without apology.",
    tags: ["execution", "mastery", "momentum"],
  },
  {
    id: "q166",
    text: "Strength does not come from winning. Your struggles develop your strength.",
    source: { name: "Goku", origin: "Dragon Ball Z" },
    category: "persistence",
    meaning: "Victory is the receipt. The gym session was the struggle. Train in difficulty, collect in performance.",
    tags: ["endurance", "mastery", "resilience"],
  },
  {
    id: "q167",
    text: "You should enjoy the little detours to the fullest. Because that's where you'll find the things more important than what you want.",
    source: { name: "Ging Freecss", origin: "Hunter x Hunter" },
    category: "persistence",
    meaning: "The journey contains the real treasure, not the destination. Pay attention to what appears along the way.",
    tags: ["patience", "hope", "mastery"],
  },
  {
    id: "q168",
    text: "I'll leave tomorrow's problems to tomorrow's me.",
    source: { name: "Saitama", origin: "One Punch Man" },
    category: "persistence",
    meaning: "Do what you can today. Don't carry tomorrow's weight on today's shoulders. One day at a time.",
    tags: ["one-step", "patience", "recovery"],
  },

  // ── Leadership ─────────────────────────────────────────────────

  {
    id: "q169",
    text: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger as well as kinder.",
    source: { name: "Gildarts", origin: "Fairy Tail" },
    category: "leadership",
    meaning: "Fear is intelligence, not cowardice. It maps your vulnerabilities so you can reinforce them.",
    tags: ["mastery", "resilience", "discipline"],
  },
  {
    id: "q170",
    text: "If nobody cares to accept you and wants you in this world, accept yourself and you will see that you don't need them and their selfish help.",
    source: { name: "Kaluto Zoldyck", origin: "Hunter x Hunter" },
    category: "leadership",
    meaning: "Self-acceptance is the ultimate foundation. External validation is supplementary, not primary.",
    tags: ["resilience", "mastery", "discipline"],
  },
  {
    id: "q171",
    text: "When do you think people die? It's when they are forgotten.",
    source: { name: "Dr. Hiluluk", origin: "One Piece" },
    category: "leadership",
    meaning: "Legacy is not monuments — it is impact on living memory. Build things people remember.",
    tags: ["execution", "connection", "momentum"],
  },
  {
    id: "q172",
    text: "The ticket to the future is always open.",
    source: { name: "Vash the Stampede", origin: "Trigun" },
    category: "leadership",
    meaning: "No matter where you've been, the path forward is never closed. Redemption is always available.",
    tags: ["hope", "resilience", "momentum"],
  },
  {
    id: "q173",
    text: "If you wanna make people dream, you've gotta start by believing in that dream yourself.",
    source: { name: "Seiya Kanie", origin: "Amagi Brilliant Park" },
    category: "leadership",
    meaning: "You cannot inspire conviction you don't possess. Believe first, then lead others to believe.",
    tags: ["execution", "hope", "mastery"],
  },
  {
    id: "q174",
    text: "Being weak is nothing to be ashamed of. Staying weak is.",
    source: { name: "Fuegoleon Vermillion", origin: "Black Clover" },
    category: "leadership",
    meaning: "Your current state is not your identity. Refusing to grow from it is the only real failure.",
    tags: ["mastery", "momentum", "discipline"],
  },

  // ── Growth ─────────────────────────────────────────────────────

  {
    id: "q175",
    text: "The world isn't perfect. But it's there for us, doing the best it can. That's what makes it so damn beautiful.",
    source: { name: "Roy Mustang", origin: "Fullmetal Alchemist: Brotherhood" },
    category: "growth",
    meaning: "Perfection is not the standard — effort is. The beauty is in the trying, not the arriving.",
    tags: ["hope", "patience", "resilience"],
  },
  {
    id: "q176",
    text: "If you can't do something, then don't. Focus on what you can do.",
    source: { name: "Shiroe", origin: "Log Horizon" },
    category: "growth",
    meaning: "Stop mourning your limitations. Redirect that energy into what is actually within your control.",
    tags: ["one-step", "execution", "mastery"],
  },
  {
    id: "q177",
    text: "I'll take a potato chip... and eat it!",
    source: { name: "Light Yagami", origin: "Death Note" },
    category: "growth",
    meaning: "Even mundane tasks deserve full commitment and theatrical conviction. Attack everything with intensity.",
    tags: ["execution", "discipline", "momentum"],
  },
  {
    id: "q178",
    text: "No matter how deep the night, it always turns to day eventually.",
    source: { name: "Brook", origin: "One Piece" },
    category: "growth",
    meaning: "Darkness is temporary by nature. Endure it knowing the cycle always turns. Dawn is inevitable.",
    tags: ["hope", "endurance", "resilience"],
  },
  {
    id: "q179",
    text: "When you give up, that's when the game ends.",
    source: { name: "Mitsuyoshi Anzai", origin: "Slam Dunk" },
    category: "growth",
    meaning: "The only true loss condition is voluntary withdrawal. As long as you're playing, the outcome is undecided.",
    tags: ["endurance", "resilience", "momentum"],
  },
  {
    id: "q180",
    text: "It's not the face that makes someone a monster; it's the choices they make with their lives.",
    source: { name: "Naruto Uzumaki", origin: "Naruto" },
    category: "growth",
    meaning: "You are not defined by circumstances, appearance, or past. You are defined by what you choose to do next.",
    tags: ["mastery", "execution", "resilience"],
  },
];
