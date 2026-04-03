/**
 * Query Keys Factory
 * Centralized query key management for TanStack Query cache
 */

// Define types for query keys
export interface QueryKey {
  all: string[];
  lists?: () => string[];
  list?: (filters: any) => string[];
  details?: () => string[];
  detail?: (id: string | number) => string[];
}

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
    list: (filters: any) => [...queryKeys.users.lists(), filters],
    details: () => [...queryKeys.users.all, "detail"],
    detail: (id: string | number) => [...queryKeys.users.details(), id],
  },

  // Campus Ambassador queries
  campusAmbassadors: {
    all: ["campus-ambassadors"],
    lists: () => [...queryKeys.campusAmbassadors.all, "list"],
    me: () => [...queryKeys.campusAmbassadors.all, "me"],
  },

  // Public profile queries
  publicProfiles: {
    all: ["public-profiles"],
    details: () => [...queryKeys.publicProfiles.all, "detail"],
    detail: (userId: string | number) => [
      ...queryKeys.publicProfiles.details(),
      userId,
    ],
  },

  // Public registration + team management queries
  publicRegistrations: {
    all: ["public-registrations"],
    my: () => [...queryKeys.publicRegistrations.all, "my"],
    invitePreview: (inviteToken: string) => [
      ...queryKeys.publicRegistrations.all,
      "invite-preview",
      inviteToken,
    ],
    pendingInvites: () => [
      ...queryKeys.publicRegistrations.all,
      "pending-invites",
    ],
    teams: () => [...queryKeys.publicRegistrations.all, "teams"],
    team: (teamId: string | number) => [
      ...queryKeys.publicRegistrations.teams(),
      teamId,
    ],
  },

  // Department queries
  departments: {
    all: ["departments"],
    lists: () => [...queryKeys.departments.all, "list"],
    list: (filters: any) => [...queryKeys.departments.lists(), filters],
    details: () => [...queryKeys.departments.all, "detail"],
    detail: (id: string | number) => [...queryKeys.departments.details(), id],
  },

  // SA clubs management queries
  clubs: {
    all: ["clubs"],
    lists: () => [...queryKeys.clubs.all, "list"],
    list: (filters: any) => [...queryKeys.clubs.lists(), filters],
    details: () => [...queryKeys.clubs.all, "detail"],
    detail: (id: string | number) => [...queryKeys.clubs.details(), id],
  },

  // Approval queries
  approvals: {
    all: ["approvals"],
    lists: () => [...queryKeys.approvals.all, "list"],
    list: (filters: any) => [...queryKeys.approvals.lists(), filters],
    details: () => [...queryKeys.approvals.all, "detail"],
    detail: (id: string | number) => [...queryKeys.approvals.details(), id],
    pending: () => [...queryKeys.approvals.all, "pending"],
    myRequests: (filters: any) => [
      ...queryKeys.approvals.all,
      "my-requests",
      filters,
    ],
  },

  // Issues queries (DH/SA resolution view)
  issues: {
    all: ["issues"],
    lists: () => [...queryKeys.issues.all, "list"],
    list: (filters: any = {}) => [...queryKeys.issues.lists(), filters],
  },

  // Registration queries (DH)
  registrations: {
    all: ["registrations"],
    pending: (filters: any = {}) => [
      ...queryKeys.registrations.all,
      "pending",
      filters,
    ],
  },

  // Payment queries
  payments: {
    all: ["payments"],
    status: (registrationId: string | number) => [
      ...queryKeys.payments.all,
      "status",
      registrationId,
    ],
    approvedUnpaid: (filters: any = {}) => [
      ...queryKeys.payments.all,
      "approved-unpaid",
      filters,
    ],
    sessions: (registrationId: string | number) => [
      ...queryKeys.payments.all,
      "sessions",
      registrationId,
    ],
  },

  // Competition queries (DH)
  competitions: {
    all: ["competitions"],
    lists: () => [...queryKeys.competitions.all, "list"],
    list: (filters: any) => [...queryKeys.competitions.lists(), filters],
    details: () => [...queryKeys.competitions.all, "detail"],
    detail: (id: string | number) => [...queryKeys.competitions.details(), id],
    judges: (id: string | number) => [
      ...queryKeys.competitions.all,
      "judges",
      id,
    ],
    volunteers: (id: string | number) => [
      ...queryKeys.competitions.all,
      "volunteers",
      id,
    ],
  },

  // Competition forms queries (DH/SA)
  forms: {
    all: ["forms"],
    lists: () => [...queryKeys.forms.all, "list"],
    list: () => [...queryKeys.forms.lists()],
    details: () => [...queryKeys.forms.all, "detail"],
    detail: (id: string | number) => [...queryKeys.forms.details(), id],
  },

  // Judging queries (DH)
  judging: {
    all: ["judging"],
    myCompetitions: () => [...queryKeys.judging.all, "my-competitions"],
    rounds: (competitionId: string | number) => [
      ...queryKeys.judging.all,
      "rounds",
      competitionId,
    ],
    participants: (roundId: string | number) => [
      ...queryKeys.judging.all,
      "participants",
      roundId,
    ],
    criteria: (roundId: string | number) => [
      ...queryKeys.judging.all,
      "criteria",
      roundId,
    ],
    leaderboard: (roundId: string | number) => [
      ...queryKeys.judging.all,
      "leaderboard",
      roundId,
    ],
    pendingJudges: (roundId: string | number) => [
      ...queryKeys.judging.all,
      "pending-judges",
      roundId,
    ],
    allScored: (roundId: string | number) => [
      ...queryKeys.judging.all,
      "all-scored",
      roundId,
    ],
    adminRounds: (competitionId: string | number) => [
      ...queryKeys.judging.all,
      "admin-rounds",
      competitionId,
    ],
    adminTeams: (competitionId: string | number) => [
      ...queryKeys.judging.all,
      "admin-teams",
      competitionId,
    ],
    adminRoundTeams: (roundId: string | number) => [
      ...queryKeys.judging.all,
      "admin-round-teams",
      roundId,
    ],
    teamScoreDetails: (roundId: string | number, teamId: string | number) => [
      ...queryKeys.judging.all,
      "team-score-details",
      roundId,
      teamId,
    ],
    pendingLockRequests: () => [
      ...queryKeys.judging.all,
      "pending-lock-requests",
    ],
  },

  // Attendance queries (DH)
  attendance: {
    all: ["attendance"],
    festStats: () => [...queryKeys.attendance.all, "fest-stats"],
    volunteerProfile: () => [...queryKeys.attendance.all, "volunteer-profile"],
    registrationDeskVolunteers: () => [
      ...queryKeys.attendance.all,
      "registration-desk-volunteers",
    ],
    competitionStats: (id: string | number) => [
      ...queryKeys.attendance.all,
      "competition-stats",
      id,
    ],
    participants: (query: string) => [
      ...queryKeys.attendance.all,
      "participants",
      query,
    ],
    participant: (id: string | number) => [
      ...queryKeys.attendance.all,
      "participant",
      id,
    ],
  },

  // Settings queries
  settings: {
    all: ["settings"],
    system: () => [...queryKeys.settings.all, "system"],
  },

  // Campaign queries (SA)
  campaigns: {
    all: ["campaigns"],
    metadata: () => [...queryKeys.campaigns.all, "metadata"],
    lists: () => [...queryKeys.campaigns.all, "list"],
    list: (filters: any) => [...queryKeys.campaigns.lists(), filters],
    details: () => [...queryKeys.campaigns.all, "detail"],
    detail: (id: string | number) => [...queryKeys.campaigns.details(), id],
    recipients: (id: string | number, filters: any = {}) => [
      ...queryKeys.campaigns.all,
      "recipients",
      id,
      filters,
    ],
  },

  // Club access queries
  club: {
    all: ["club"],
    myClubs: () => [...queryKeys.club.all, "my-clubs"],
    dashboard: () => [...queryKeys.club.all, "dashboard"],
    members: (clubId: string | number) => [
      ...queryKeys.club.all,
      "members",
      clubId,
    ],
    competitions: () => [...queryKeys.club.all, "competitions"],
    competitionDetail: (competitionId: string | number) => [
      ...queryKeys.club.all,
      "competition",
      competitionId,
    ],
    competitionRegistrations: (competitionId: string | number) => [
      ...queryKeys.club.all,
      "competition-registrations",
      competitionId,
    ],
    competitionFormResponses: (competitionId: string | number) => [
      ...queryKeys.club.all,
      "competition-form-responses",
      competitionId,
    ],
    proposals: {
      all: () => [...queryKeys.club.all, "proposals"],
      mine: (filters: any = {}) => [
        ...queryKeys.club.all,
        "proposals",
        "my",
        filters,
      ],
    },
  },

  // Review queue queries (SA/DH)
  reviews: {
    all: ["reviews"],
    list: (filters: any = {}) => [...queryKeys.reviews.all, "list", filters],
    detail: (proposalId: string | number) => [
      ...queryKeys.reviews.all,
      "detail",
      proposalId,
    ],
  },
};
