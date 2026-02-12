import type { RoleKey } from "@/lib/rbac";

import { clearAuthSession } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export type UmugandaEventSummary = {
  id: string;
  date: string;
  theme: string;
  location: string | null;
  unionId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    attendance: number;
  };
  union: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type CreateUmugandaEventInput = {
  date: string;
  theme: string;
  location?: string | null;
  description?: string | null;
};

export type UmugandaEventAttendance = {
  id: string;
  eventId: string;
  memberId: string;
  churchId: string;
  checkedInAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
  };
  church: {
    id: string;
    name: string;
  };
};

export type DistrictSummary = {
  id: string;
  name: string;
  unionId: string;
  location?: string | null;
};

export type DistrictPayload = {
  id: string;
  name: string;
  unionId: string;
  location?: string | null;
  churches?: { id: string; name: string }[];
};

export type ChurchSummary = {
  id: string;
  name: string;
  location?: string | null;
  districtId: string;
  district?: {
    id: string;
    name: string;
    unionId: string;
  } | null;
  _count?: {
    members?: number;
    sessions?: number;
  } | null;
};

export type AttendanceReportSummary = {
  total: number;
  approved: number;
  pending: number;
};

export type AttendanceReportBreakdown =
  | {
      groupBy: 'church';
      data: {
        churchId: string;
        churchName: string;
        districtId: string | null;
        attendanceCount: number;
      }[];
    }
  | {
      groupBy: 'district';
      data: {
        districtId: string;
        districtName: string;
        attendanceCount: number;
      }[];
    };

export type AttendanceReportResponse = {
  summary: AttendanceReportSummary;
  breakdown?: AttendanceReportBreakdown;
};

export type DistrictPastorSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  districtId: string | null;
  isActive: boolean;
  district: {
    id: string;
    name: string;
    unionId: string;
  } | null;
  pastorChurches: ChurchSummary[];
  createdAt: string;
};

export type AttendanceStatus = 'PENDING' | 'APPROVED';

export type AttendanceRecordSummary = {
  id: string;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    phoneNumber: string | null;
  } | null;
  session: {
    id: string;
    date: string;
    church: {
      id: string;
      name: string;
      districtId: string;
    } | null;
  } | null;
  pass: {
    id: string;
    token: string;
    smsSentAt: string | null;
  } | null;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type UnionSummary = {
  id: string;
  name: string;
  description?: string | null;
};

export type UnionStats = {
  totalMembers: number;
  totalDistricts: number;
  totalChurches: number;
  totalPastors: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  memberGrowth: Array<{ date: string; count: number }>;
  attendanceTrends: Array<{ month: string; attendance: number }>;
};

export type AuditLogEntry = {
  id: string;
  createdAt: string;
  action: string;
  userName: string;
  userRole: RoleKey | null;
  userId: string | null;
  unionId: string | null;
  districtId: string | null;
  churchId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details?: Record<string, unknown> | null;
};

export type AuditLogSummary = {
  logs: AuditLogEntry[];
  total: number;
  countsByAction: Array<{ action: string; count: number }>;
  countsByRole: Array<{ role: RoleKey | null; count: number }>;
  nextCursor: string | null;
};

type RequestOptions = {
  token?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

type ApiResponse<T> = {
  data: T;
};

const buildHeaders = (token: string | undefined, hasBody: boolean) => {
  const headers = new Headers();

  headers.set('Accept', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (hasBody) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
};

const request = async <T>(path: string, { token, method = "GET", body }: RequestOptions): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  console.log(`[api] ${method} →`, url);

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(token, Boolean(body)),
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      credentials: "include",
      mode: "cors",
    });

    console.log(`[api] ${method} ← ${response.status} ${response.statusText}`);

    const headerSnapshot: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headerSnapshot[key] = value;
    });
    console.log("[api] response headers", headerSnapshot);

    const payload = await response.json().catch(() => {
      console.error("[api] failed to parse JSON response");
      return null;
    });

    if (!response.ok) {
      console.error("[api] request failed", { status: response.status, payload });
      if (response.status === 401) {
        clearAuthSession();
      }
      const base = (payload as { error?: string })?.error ?? `Request failed (${response.status})`;
      const details = (payload as { details?: unknown })?.details;
      let detailMessage: string | null = null;

      if (typeof details === "string") {
        detailMessage = details;
      } else if (Array.isArray(details)) {
        detailMessage = details
          .filter((item) => typeof item === "string")
          .join(", ");
      } else if (details && typeof details === "object") {
        const stringified = JSON.stringify(details);
        detailMessage = stringified === "{}" ? null : stringified;
      }

      const message = detailMessage ? `${base}: ${detailMessage}` : base;
      const error = new Error(message);
      (error as Error & { status?: number }).status = response.status;
      throw error;
    }

    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as ApiResponse<T>).data;
    }

    return payload as T;
  } catch (error) {
    console.error("[api] request error", error);
    throw error;
  }
};

export const fetchDistricts = async (token: string, params?: { unionId?: string }) => {
  const query = params?.unionId ? `?unionId=${encodeURIComponent(params.unionId)}` : "";
  const payload = await request<{ districts: DistrictSummary[] }>(`/api/districts${query}`, { token });
  return payload.districts;
};

export const fetchDistrictDetail = async (token: string, districtId: string) => {
  const payload = await request<{ district: DistrictPayload }>(`/api/districts/${districtId}`, { token });
  return payload.district;
};

export const createDistrict = (
  token: string,
  input: { unionId: string; name: string; location?: string | null },
) => request<{ district: DistrictPayload }>("/api/districts", { token, method: "POST", body: input });

export const updateDistrict = (
  token: string,
  districtId: string,
  input: { unionId?: string; name?: string; location?: string | null },
) => request<{ district: DistrictPayload }>(`/api/districts/${districtId}`, {
  token,
  method: "PATCH",
  body: input,
});

export const deleteDistrict = (token: string, districtId: string) =>
  request<{ success: boolean }>(`/api/districts/${districtId}`, {
    token,
    method: "DELETE",
  });

export const fetchChurches = async (token: string, params?: { districtId?: string }) => {
  const query = params?.districtId ? `?districtId=${encodeURIComponent(params.districtId)}` : "";
  const payload = await request<{ churches: ChurchSummary[] }>(`/api/churches${query}`, { token });
  return payload.churches;
};

export const fetchChurchDetail = async (token: string, churchId: string) => {
  const payload = await request<{ church: ChurchSummary }>(`/api/churches/${churchId}`, { token });
  return payload.church;
};

export const fetchDistrictPastors = async (token: string, params?: { districtId?: string }) => {
  const query = params?.districtId ? `?districtId=${encodeURIComponent(params.districtId)}` : "";
  const payload = await request<{ pastors: DistrictPastorSummary[] }>(`/api/district-pastors${query}`, { token });
  return payload.pastors;
};

export const fetchUnions = async (token: string) => {
  const payload = await request<{ unions: UnionSummary[] }>("/api/unions", { token });
  return payload.unions;
};

export const fetchUnionStats = async (token: string): Promise<UnionStats> => {
  const payload = await request<{ stats: UnionStats }>("/api/unions/stats", { token });
  return payload.stats;
};

export const fetchAuditLogs = async (
  token: string,
  params: {
    action?: string;
    role?: RoleKey;
    search?: string;
    cursor?: string;
    limit?: number;
  } = {},
): Promise<AuditLogSummary> => {
  const query = new URLSearchParams();
  if (params.action) {
    query.set("action", params.action);
  }
  if (params.role) {
    query.set("role", params.role);
  }
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (typeof params.limit === "number") {
    query.set("limit", String(params.limit));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<AuditLogSummary>(`/api/audit-logs${suffix}`, { token });
};

export const createChurch = (token: string, input: { districtId: string; name: string; location?: string | null }) =>
  request<ChurchSummary>('/api/churches', { token, method: 'POST', body: input });

export const updateChurch = (
  token: string,
  churchId: string,
  input: Partial<{ name: string; location?: string | null; districtId?: string }>,
) =>
  request<{ church: ChurchSummary }>(`/api/churches/${churchId}`, {
    token,
    method: 'PATCH',
    body: input,
  });

export const deleteChurch = (token: string, churchId: string) =>
  request<{ success: boolean }>(`/api/churches/${churchId}`, {
    token,
    method: 'DELETE',
  });

export const assignChurchesToPastor = async (
  token: string,
  pastorId: string,
  churchIds: string[],
): Promise<DistrictPastorSummary> => {
  const payload = await request<{ pastor: DistrictPastorSummary }>(`/api/district-pastors/${pastorId}`, {
    token,
    method: "PUT",
    body: { churchIds },
  });

  return payload.pastor;
};

export const createDistrictPastor = (
  token: string,
  input: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    districtId: string;
    password: string;
  },
) =>
  request<{ pastor: DistrictPastorSummary }>("/api/district-pastors", {
    token,
    method: "POST",
    body: input,
  });

export const updateDistrictPastor = (
  token: string,
  pastorId: string,
  input: Partial<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    districtId: string | null;
    isActive: boolean;
  }>,
) => request<{ pastor: DistrictPastorSummary }>(`/api/district-pastors/${pastorId}`, {
  token,
  method: "PATCH",
  body: input,
});

export const deleteDistrictPastor = (token: string, pastorId: string) =>
  request<{ success: boolean }>(`/api/district-pastors/${pastorId}`, {
    token,
    method: "DELETE",
  });

export type ChurchAdminSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  isActive: boolean;
  districtId: string | null;
  churchId: string | null;
  church?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
};

export type MemberPassSummary = {
  token: string;
  smsSentAt: string | null;
  expiresAt: string | null;
};

export type MemberSummary = {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string | null;
  createdAt: string;
  church?: {
    id: string;
    name: string;
    districtId: string;
  } | null;
  memberPass?: MemberPassSummary | null;
};

export type CreateMemberInput = {
  nationalId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  password: string;
};

export type CreateMemberResult = {
  member: MemberSummary;
  memberPass: {
    id: string;
    token: string;
    qrPayload: string;
    smsSentAt: string | null;
  };
};

export type MemberPassDetails = {
  id: string;
  token: string;
  qrPayload: string;
  smsSentAt: string | null;
  expiresAt: string | null;
};

export type MemberPassViewer = {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string | null;
  email: string | null;
  createdAt: string;
  church: {
    id: string;
    name: string;
    districtId: string;
  } | null;
};

export type MemberPassResponse = {
  member: MemberPassViewer;
  pass: MemberPassDetails;
};

export type PassVerificationResponse =
  | {
      valid: true;
      passId: string;
      issuedAt: string;
      sessionDate: string;
      church: {
        id: string;
        name: string;
      } | null;
      member: {
        firstName: string;
        lastName: string;
        nationalId: string;
      } | null;
    }
  | {
      valid: false;
      reason?: string;
    };

export const verifyPassToken = (token: string, passToken: string) =>
  request<PassVerificationResponse>(`/api/passes/${encodeURIComponent(passToken)}`, { token });

export const fetchChurchAdmins = async (token: string, params?: { districtId?: string; churchId?: string }) => {
  const query = new URLSearchParams();
  if (params?.districtId) {
    query.set("districtId", params.districtId);
  }
  if (params?.churchId) {
    query.set("churchId", params.churchId);
  }
  const queryString = query.toString();
  const payload = await request<{ admins: ChurchAdminSummary[] }>(
    `/api/church-admins${queryString ? `?${queryString}` : ""}`,
    { token },
  );
  return payload.admins;
};

export const fetchAttendance = async (
  token: string,
  params?: { districtId?: string; churchId?: string; sessionId?: string; status?: AttendanceStatus },
) => {
  const query = new URLSearchParams();
  if (params?.districtId) {
    query.set("districtId", params.districtId);
  }
  if (params?.churchId) {
    query.set("churchId", params.churchId);
  }
  if (params?.sessionId) {
    query.set("sessionId", params.sessionId);
  }
  if (params?.status) {
    query.set("status", params.status);
  }
  const queryString = query.toString();
  const payload = await request<{ attendance: AttendanceRecordSummary[] }>(
    `/api/attendance${queryString ? `?${queryString}` : ""}`,
    { token },
  );
  return payload.attendance;
};

export const fetchAttendanceReport = async (
  token: string,
  params?: {
    districtId?: string;
    churchId?: string;
    sessionId?: string;
    status?: AttendanceStatus;
    fromDate?: string;
    toDate?: string;
    groupBy?: 'church' | 'district';
  },
) => {
  const query = new URLSearchParams();
  if (params?.districtId) {
    query.set('districtId', params.districtId);
  }
  if (params?.churchId) {
    query.set('churchId', params.churchId);
  }
  if (params?.sessionId) {
    query.set('sessionId', params.sessionId);
  }
  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.fromDate) {
    query.set('fromDate', params.fromDate);
  }
  if (params?.toDate) {
    query.set('toDate', params.toDate);
  }
  if (params?.groupBy) {
    query.set('groupBy', params.groupBy);
  }

  const queryString = query.toString();
  return request<AttendanceReportResponse>(
    `/api/reports/attendance${queryString ? `?${queryString}` : ''}`,
    { token },
  );
};

export const createChurchAdmin = (
  token: string,
  input: {
    churchId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    password: string;
  },
) =>
  request<{ admin: ChurchAdminSummary }>("/api/church-admins", {
    token,
    method: "POST",
    body: input,
  });

export const updateChurchAdmin = (
  token: string,
  adminId: string,
  input: Partial<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    churchId: string;
    isActive: boolean;
  }>,
) =>
  request<{ admin: ChurchAdminSummary }>(`/api/church-admins/${adminId}`, {
    token,
    method: "PATCH",
    body: input,
  });

export const deleteChurchAdmin = (token: string, adminId: string) =>
  request<{ success: boolean }>(`/api/church-admins/${adminId}`, {
    token,
    method: "DELETE",
  });

export const fetchChurchMembers = async (
  token: string,
  params?: { churchId?: string; districtId?: string },
) => {
  const query = new URLSearchParams();
  if (params?.churchId) {
    query.set("churchId", params.churchId);
  }
  if (params?.districtId) {
    query.set("districtId", params.districtId);
  }
  const queryString = query.toString();
  const payload = await request<{ members: MemberSummary[] }>(
    `/api/members${queryString ? `?${queryString}` : ""}`,
    { token },
  );
  return payload.members;
};

export const createMember = (token: string, input: CreateMemberInput) =>
  request<CreateMemberResult>("/api/members", {
    token,
    method: "POST",
    body: input,
  });

export const deleteMember = (token: string, memberId: string) =>
  request<{ success: boolean }>(`/api/members/${memberId}`, {
    token,
    method: "DELETE",
  });

export const fetchMemberPass = (token: string, memberId: string) =>
  request<MemberPassResponse>(`/api/members/${memberId}/pass`, {
    token,
  });

export interface MemberAttendance {
  id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Excused';
  theme: string;
  hours: number;
  church: {
    id: string;
    name: string;
  };
}

export interface UpcomingSession {
  id: string;
  date: string;
  theme: string;
  callTime: string;
  location: string;
  church: {
    id: string;
    name: string;
  };
}

export const fetchMemberAttendance = (token: string, memberId: string) =>
  request<{ attendance: MemberAttendance[] }>(`/api/members/${memberId}/attendance`, {
    token,
  });

export const fetchUpcomingSessions = async (token: string, churchId?: string) => {
  const events = await fetchUmugandaEvents(token);
  const now = new Date();
  const upcoming = events.filter(event => new Date(event.date) > now);
  const sessions: UpcomingSession[] = upcoming.map(event => ({
    id: event.id,
    date: event.date,
    theme: event.theme,
    callTime: '', // Not applicable for Umuganda events
    location: event.location || '',
    church: {
      id: '',
      name: '',
    }, // Default, since Umuganda events are union-wide
  }));
  return { sessions };
};

export const requestPasswordReset = (input: { nationalId?: string; email?: string }) =>
  request<{ success: boolean }>("/api/auth/password-reset/request", {
    method: "POST",
    body: input,
  });

export async function confirmPasswordReset(input: { token: string; newPassword: string }) {
  return request<{ success: boolean }>("/api/auth/password-reset/confirm", {
    method: "POST",
    body: input,
  });
}

export type MeResponse = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string | null;
    role: RoleKey;
    unionId: string | null;
    districtId: string | null;
    churchId: string | null;
  };
};

export const fetchMe = async (token: string) => {
  const payload = await request<MeResponse>("/api/users/me", { token });
  return payload.user;
};

export const updateMe = async (
  token: string,
  input: Partial<{ firstName: string; lastName: string; email: string | null; phoneNumber: string }>,
) => {
  const payload = await request<MeResponse>("/api/users/me", {
    token,
    method: 'PATCH',
    body: input,
  });
  return payload.user;
};

export const changePasswordRequest = async (
  token: string,
  input: { currentPassword: string; newPassword: string },
) => {
  return request<{ success: boolean }>("/api/auth/change-password", {
    token,
    method: 'POST',
    body: input,
  });
};

// Umuganda Events API
export async function fetchUmugandaEvents(token: string) {
  const payload = await request<{ events: UmugandaEventSummary[] }>("/api/umuganda-events", {
    token,
  });

  return payload.events;
}

export async function createUmugandaEvent(token: string, input: CreateUmugandaEventInput) {
  const payload = await request<{ event: UmugandaEventSummary }>("/api/umuganda-events", {
    token,
    method: "POST",
    body: input,
  });

  return payload.event;
}

export async function fetchUmugandaEventById(token: string, eventId: string) {
  const payload = await request<{ event: UmugandaEventSummary }>(`/api/umuganda-events/${eventId}`, {
    token,
  });

  return payload.event;
}

export async function updateUmugandaEvent(
  token: string,
  eventId: string,
  input: Partial<CreateUmugandaEventInput>,
) {
  const payload = await request<{ event: UmugandaEventSummary }>(`/api/umuganda-events/${eventId}`, {
    token,
    method: "PATCH",
    body: input,
  });

  return payload.event;
}

export async function deleteUmugandaEvent(token: string, eventId: string) {
  return request<{ success: boolean }>(`/api/umuganda-events/${eventId}`, {
    token,
    method: "DELETE",
  });
}

export async function checkInToUmugandaEvent(token: string, eventId: string, memberToken: string) {
  const payload = await request<{ attendance: UmugandaEventAttendance }>(
    `/api/umuganda-events/${eventId}/attendance`,
    {
      token,
      method: "POST",
      body: { token: memberToken },
    },
  );

  return payload.attendance;
}

export async function fetchUmugandaEventAttendance(
  token: string,
  eventId: string,
  params?: { churchId?: string },
) {
  const query = new URLSearchParams();
  if (params?.churchId) {
    query.append("churchId", params.churchId);
  }

  const payload = await request<{ attendance: UmugandaEventAttendance[] }>(
    `/api/umuganda-events/${eventId}/attendance${query.toString() ? `?${query.toString()}` : ""}`,
    { token },
  );

  return payload.attendance;
}
