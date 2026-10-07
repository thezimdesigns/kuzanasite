import type {
  AnnouncementPriority,
  DocumentType,
  ExhibitorStatus,
  FeedbackStatus,
  ParticipantRole,
  PartnerTier,
  SessionType,
  VideoCategory,
} from "@/lib/generated/prisma/enums";

export const OPPORTUNITIES = [
  "Customers",
  "Distributors",
  "Investors",
  "Sponsorship",
  "Partnerships",
  "Suppliers",
  "Government opportunities",
  "Export opportunities",
  "Talent",
  "Media exposure",
  "Other",
];

export const FEEDBACK_CATEGORIES = [
  "Suggestion",
  "Compliment",
  "Complaint",
  "Question",
  "Event Feedback",
  "Business Opportunity",
  "Lost and Found",
  "Accessibility",
  "Safety",
];

export const VISITOR_TYPES = [
  "General Visitor",
  "Conference Delegate",
  "Business Visitor",
  "Exhibitor Representative",
  "Media",
  "Sponsor / Partner",
  "Government / Institutional",
  "Artist / Creative",
  "Athlete / Sports Professional",
  "Student",
  "Other",
];

export const VISITOR_INTERESTS = [
  "Exhibitions",
  "Conferences",
  "Boxing",
  "Marathon",
  "Music",
  "Football",
  "Sport",
  "Arts and Culture",
  "Fashion",
  "Creative Industries",
  "Technology",
  "Investment",
  "Business Opportunities",
  "Future KUZANA Editions",
];

export const AGE_RANGES = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];

export const INTEREST_TYPES = [
  "Visitor",
  "Exhibitor",
  "Sponsor",
  "Speaker",
  "Artist",
  "Athlete",
  "Investor",
  "Media",
  "Supplier",
  "Volunteer",
  "Partner",
];

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  REGISTRATION: "Registration",
  OPENING_CEREMONY: "Opening ceremony",
  KEYNOTE: "Keynote",
  PRESENTATION: "Presentation",
  PANEL_DISCUSSION: "Panel discussion",
  WORKSHOP: "Workshop",
  QA: "Q&A",
  NETWORKING: "Networking",
  CULTURAL_PERFORMANCE: "Cultural performance",
  BREAK: "Break",
  LUNCH: "Lunch",
  CLOSING_SESSION: "Closing session",
  OTHER: "Other",
};

export const PARTICIPANT_ROLE_LABELS: Record<ParticipantRole, string> = {
  SPEAKER: "Speaker",
  PANELLIST: "Panellist",
  MODERATOR: "Moderator",
  FACILITATOR: "Facilitator",
  GUEST_OF_HONOUR: "Guest of Honour",
  PERFORMER: "Performer",
  ARTIST: "Artist",
  ATHLETE: "Athlete",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PRESS_RELEASE: "Press release",
  SPEECH: "Speech",
  PRESENTATION: "Presentation",
  REPORT: "Report",
  PRESS_KIT: "Press kit",
  BRAND_ASSET: "Brand asset",
  PROGRAMME: "Programme",
  OTHER: "Other",
};

/** Public media-centre sections, keyed by URL segment. */
export const MEDIA_SECTIONS: Record<string, { title: string; types: DocumentType[] }> = {
  "press-releases": { title: "Press releases", types: ["PRESS_RELEASE"] },
  speeches: { title: "Speeches", types: ["SPEECH"] },
  presentations: { title: "Presentations", types: ["PRESENTATION"] },
  "press-kits": { title: "Press kits & brand assets", types: ["PRESS_KIT", "BRAND_ASSET"] },
  documents: { title: "Reports & programmes", types: ["REPORT", "PROGRAMME", "OTHER"] },
};

export const VIDEO_CATEGORY_LABELS: Record<VideoCategory, string> = {
  HIGHLIGHTS: "Highlights",
  INTERVIEWS: "Interviews",
  SPEECHES: "Speeches",
  CONFERENCE_SESSIONS: "Conference sessions",
  PERFORMANCES: "Performances",
  SPORT: "Sport",
  BEHIND_THE_SCENES: "Behind the scenes",
  PROMOTIONAL: "Promotional",
};

export const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  INFO: "Info",
  IMPORTANT: "Important",
  URGENT: "Urgent",
};

export const EXHIBITOR_STATUS_LABELS: Record<ExhibitorStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  NEEDS_INFORMATION: "Needs information",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under review",
  ASSIGNED: "Assigned",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
};

export const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  HOST: "Host",
  PARTNER: "Partner",
  SPONSOR: "Sponsor",
  MEDIA: "Media partner",
  SUPPORTER: "Supporter",
};
