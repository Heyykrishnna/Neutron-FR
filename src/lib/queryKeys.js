/**
 * Query Keys Factory
 * Centralized query key management for TanStack Query cache
 */

export const queryKeys = {
  // Auth queries
  auth: {
    all: ["auth"],
    me: () => [...queryKeys.auth.all, "me"],
  },

  // User queries
  users: {
    all: ["users"],
    lists: () => [...queryKeys.users.all, "list"],
    list: (filters) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, "detail"],
    detail: (id) => [...queryKeys.users.details(), id],
  },

  // Department queries
  departments: {
    all: ["departments"],
    lists: () => [...queryKeys.departments.all, "list"],
    list: (filters) => [...queryKeys.departments.lists(), filters],
    details: () => [...queryKeys.departments.all, "detail"],
    detail: (id) => [...queryKeys.departments.details(), id],
  },

  // Approval queries
  approvals: {
    all: ["approvals"],
    lists: () => [...queryKeys.approvals.all, "list"],
    list: (filters) => [...queryKeys.approvals.lists(), filters],
    details: () => [...queryKeys.approvals.all, "detail"],
    detail: (id) => [...queryKeys.approvals.details(), id],
    pending: () => [...queryKeys.approvals.all, "pending"],
  },

  // Registration queries (DH)
  registrations: {
    all: ["registrations"],
    pending: (filters = {}) => [...queryKeys.registrations.all, "pending", filters],
  },

  // Competition queries (DH)
  competitions: {
    all: ["competitions"],
    lists: () => [...queryKeys.competitions.all, "list"],
    list: (filters) => [...queryKeys.competitions.lists(), filters],
    details: () => [...queryKeys.competitions.all, "detail"],
    detail: (id) => [...queryKeys.competitions.details(), id],
    judges: (id) => [...queryKeys.competitions.all, "judges", id],
    volunteers: (id) => [...queryKeys.competitions.all, "volunteers", id],
  },

  // Judging queries (DH)
  judging: {
    all: ["judging"],
    myCompetitions: () => [...queryKeys.judging.all, "my-competitions"],
    rounds: (competitionId) => [...queryKeys.judging.all, "rounds", competitionId],
    participants: (roundId) => [...queryKeys.judging.all, "participants", roundId],
    criteria: (roundId) => [...queryKeys.judging.all, "criteria", roundId],
    leaderboard: (roundId) => [...queryKeys.judging.all, "leaderboard", roundId],
    pendingJudges: (roundId) => [...queryKeys.judging.all, "pending-judges", roundId],
    allScored: (roundId) => [...queryKeys.judging.all, "all-scored", roundId],
  },

  // Attendance queries (DH)
  attendance: {
    all: ["attendance"],
    festStats: () => [...queryKeys.attendance.all, "fest-stats"],
    competitionStats: (id) => [...queryKeys.attendance.all, "competition-stats", id],
    participants: (query) => [...queryKeys.attendance.all, "participants", query],
    participant: (id) => [...queryKeys.attendance.all, "participant", id],
  },

  // Settings queries
  settings: {
    all: ["settings"],
    system: () => [...queryKeys.settings.all, "system"],
  },
};
