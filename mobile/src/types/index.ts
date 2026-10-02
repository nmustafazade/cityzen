export type UserRole = "CITIZEN" | "EMPLOYEE" | "DEPARTMENT_HEAD" | "ADMIN";
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone: string | null;
  profileImageUrl: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  department: { id: number; name: string } | null;
};
export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
export type ReportStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";
export type Report = {
  id: number;
  title: string;
  description: string;
  status: ReportStatus;
  priority: string;
  addressText: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  createdAt: string;
  updatedAt: string;
  category: { id: number; name: string; icon?: string | null };
  images: { id: number; imageUrl: string }[];
  department?: { id: number; name: string } | null;
  statusHistory?: {
    id: number;
    newStatus: ReportStatus;
    note: string | null;
    createdAt: string;
  }[];
  upvoteCount?: number;
};
export type Service = {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  department: { id: number; name: string };
  requirements: string | null;
  instructions: string | null;
  allowsDocuments: boolean;
  maxDocuments: number;
  supportsAppointments: boolean;
  fields?: {
    id: number;
    label: string;
    fieldKey: string;
    type: string;
    isRequired: boolean;
    options: { value: string; label: string }[] | null;
  }[];
};
export type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  report?: { id: number } | null;
  serviceRequest?: { id: number } | null;
};
