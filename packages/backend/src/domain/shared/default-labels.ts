export const DEFAULT_LABELS = [
  {
    name: "Important",
    prompt:
      "Emails requiring personal attention or action: direct messages from real people, time-sensitive requests, meeting invitations, personal correspondence, financial alerts, or anything that needs a human reply",
  },
  {
    name: "Can Wait",
    prompt:
      "Emails that are relevant but not urgent: FYI updates, team announcements, project status updates, non-urgent requests, informational emails that can be read later",
  },
  {
    name: "Auto-archive",
    prompt:
      "Emails that need no attention: automated notifications, CI/CD alerts, system logs, transactional receipts, password reset confirmations, shipping confirmations, read receipts",
  },
  {
    name: "Newsletter",
    prompt:
      "Newsletter and digest content: recurring email newsletters, blog digests, weekly roundups, curated content emails, RSS-to-email digests, industry reports",
  },
] as const;
