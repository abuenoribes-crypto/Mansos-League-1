
export const RULES = {
  INITIAL_BUDGET: 100, // M
  HARD_CAP_CLAUSES: 1000, // M
  MIN_PLAYERS: 21,
  MIN_CLAUSE: 10, // M
  REQUIRED_GK: 2,
  GK_PENALTY: -50, // M penalty for not having 2 GKs
  DEBT_LIMIT: -50, // M
  WIN_BOTH_REWARD: 5, // M
  WIN_ONE_REWARD: 2.5, // M
  MARKET_CYCLE_WEEKS: 3,
  FINANCIAL_CRISIS_FACTOR: 10,
  SANCTION_RED_CARD: [1, 2], // Range of matches
  SANCTION_INJURY: [1, 4], // Range of matches
  
  // League Standing Rewards
  STANDINGS_REWARDS: {
    1: 30, // 1st
    2: 15, // 2nd
    3: 10, // 3rd
    4: 5,  // 4th
    7: -20, // 7th
    8: -30  // 8th
  },

  // Final Four Rewards
  FINAL_FOUR_QUALIFY_REWARD: 15,
  FINAL_FOUR_RUNNER_UP_REWARD: 20,
  FINAL_FOUR_CHAMPION_REWARD: 25,
};

export const POSITIONS = ['GK', 'DF', 'MF', 'FW'] as const;
