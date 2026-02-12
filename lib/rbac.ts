export type RoleKey =
  | "UNION_ADMIN"
  | "DISTRICT_ADMIN"
  | "CHURCH_ADMIN"
  | "MEMBER"
  | "POLICE_VERIFIER";

export type RoleDefinition = {
  name: string;
  description: string;
  responsibilities: string[];
  limitations: string[];
  accent: {
    primary: string;
    secondary: string;
  };
};

export type ActionPolicy = {
  action: string;
  allowedRoles: RoleKey[];
};

export const ROLE_DEFINITIONS: Record<RoleKey, RoleDefinition> = {
  UNION_ADMIN: {
    name: "Union Admin",
    description: "Top-level leadership overseeing the entire SDA Umuganda ecosystem.",
    responsibilities: [
      "Create and manage district pastors",
      "Review union-wide analytics and compliance",
      "Set policy, access levels, and audit governance",
      "Monitor churches and attendance across Rwanda",
    ],
    limitations: ["Cannot access personal member profiles without purpose"],
    accent: {
      primary: "#0F3B72",
      secondary: "#3BB784",
    },
  },
  DISTRICT_ADMIN: {
    name: "Senior Pastor",
    description: "Regional leader coordinating multiple churches within the district.",
    responsibilities: [
      "Create and assign church administrators",
      "Monitor district participation and compliance",
      "Generate district-level reports",
      "Escalate issues to union leadership",
    ],
    limitations: [
      "Cannot modify union-level settings",
      "Cannot view churches beyond their district",
    ],
    accent: {
      primary: "#1A5F63",
      secondary: "#F3B700",
    },
  },
  CHURCH_ADMIN: {
    name: "Church Elder",
    description: "On-the-ground operator registering members and capturing attendance.",
    responsibilities: [
      "Register members and update records",
      "Record Umuganda attendance and approvals",
      "Trigger digital pass generation",
      "Review church-level insights",
    ],
    limitations: [
      "Cannot manage other churches",
      "Cannot create district administrators",
    ],
    accent: {
      primary: "#74266F",
      secondary: "#4CD3C2",
    },
  },
  MEMBER: {
    name: "Member",
    description: "Local church member receiving service benefits and visibility.",
    responsibilities: [
      "Participate in Umuganda activities",
      "Review personal attendance history",
      "Access and present QR passes when needed",
    ],
    limitations: [
      "Read-only system access",
      "No administrative privileges",
    ],
    accent: {
      primary: "#185C4D",
      secondary: "#8FD6BD",
    },
  },
  POLICE_VERIFIER: {
    name: "Police Verifier",
    description: "External verification officer scanning QR passes on-site.",
    responsibilities: ["Scan QR codes", "Validate pass authenticity in real time"],
    limitations: [
      "No login required (optional)",
      "Cannot view member personal data",
      "No modification permissions",
    ],
    accent: {
      primary: "#313A52",
      secondary: "#89A0FF",
    },
  },
};

export const ACTION_MATRIX: ActionPolicy[] = [
  { action: "Create districts", allowedRoles: ["UNION_ADMIN"] },
  { action: "Create churches", allowedRoles: ["UNION_ADMIN", "DISTRICT_ADMIN"] },
  { action: "Register members", allowedRoles: ["CHURCH_ADMIN"] },
  { action: "Mark attendance", allowedRoles: ["CHURCH_ADMIN"] },
  { action: "Generate pass", allowedRoles: ["CHURCH_ADMIN"] },
  { action: "Receive SMS", allowedRoles: ["MEMBER"] },
  { action: "View reports", allowedRoles: ["UNION_ADMIN", "DISTRICT_ADMIN", "CHURCH_ADMIN"] },
  { action: "Verify QR", allowedRoles: ["POLICE_VERIFIER"] },
];

export const ORDERED_ROLES: RoleKey[] = [
  "UNION_ADMIN",
  "DISTRICT_ADMIN",
  "CHURCH_ADMIN",
  "MEMBER",
  "POLICE_VERIFIER",
];

export const ROLE_ROUTES: Record<RoleKey, string> = {
  UNION_ADMIN: "/union/dashboard",
  DISTRICT_ADMIN: "/district/dashboard",
  CHURCH_ADMIN: "/church/dashboard",
  MEMBER: "/",
  POLICE_VERIFIER: "/police/verify",
};
