const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const VIDEO_BASE_URL = BASE_URL;

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem("devclass-auth");
    return raw ? (JSON.parse(raw).token ?? null) : null;
  } catch { return null; }
}

export function getAuthUser(): { id: number; email: string; name: string; role: string } | null {
  try {
    const raw = localStorage.getItem("devclass-auth");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getLocalUserId(fallback = 0): number {
  try {
    const raw = localStorage.getItem("devclass-auth");
    return raw ? (JSON.parse(raw).id ?? fallback) : fallback;
  } catch { return fallback; }
}

export async function apiFetch(path: string, options?: RequestInit) {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const mergedHeaders = { ...headers, ...(options?.headers as Record<string, string> ?? {}) };
  const { headers: _h, ...restOptions } = options ?? {};
  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: mergedHeaders,
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "서버 오류가 발생했습니다." }));
    throw new Error(error.message || "오류가 발생했습니다.");
  }

  if (res.status === 204) return null;

  return res.json();
}

export async function apiUpload(
  path: string,
  formData: FormData,
  method = "POST"
) {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
    // Content-Type 헤더 설정 안 함 - 브라우저가 multipart boundary 자동 설정
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ message: "서버 오류가 발생했습니다." }));
    throw new Error(error.message || "오류가 발생했습니다.");
  }

  if (res.status === 204) return null;

  return res.json();
}

export function thumbnailSrc(courseId: number): string {
  return `${BASE_URL}/courses/${courseId}/thumbnail`;
}

// ─── 인증 ────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string; role: string }) =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    apiFetch("/auth/login", { method: "POST", body: JSON.stringify(data) }),
};

// ─── 장바구니 ──────────────────────────────────────
export const cartApi = {
  getCart: (userId: number) => apiFetch(`/users/${userId}/cart`),
  addToCart: (userId: number, courseId: number) =>
    apiFetch(`/users/${userId}/cart`, {
      method: "POST",
      body: JSON.stringify({ courseId }),
    }),
  removeFromCart: (cartItemId: number, userId: number) =>
    apiFetch(`/cart/${cartItemId}?userId=${userId}`, { method: "DELETE" }),
};

// ─── 결제 ──────────────────────────────────────────
export const paymentApi = {
  prepare: (userId: number, courseIds: number[]) =>
    apiFetch("/payments/prepare", {
      method: "POST",
      body: JSON.stringify({ userId, courseIds }),
    }),
  confirm: (data: {
    userId: number;
    paymentKey: string;
    orderId: string;
    amount: number;
  }) => apiFetch("/payments/confirm", { method: "POST", body: JSON.stringify(data) }),
  getMyPayments: (userId: number) => apiFetch(`/payments/users/${userId}`),
  cancel: (
    paymentId: number,
    data: { userId: number; paymentItemId?: number; reason: string; refundType: string }
  ) =>
    apiFetch(`/payments/${paymentId}/cancel`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── 리뷰 ──────────────────────────────────────────
export const reviewApi = {
  getCourseReviews: (courseId: number) => apiFetch(`/courses/${courseId}/reviews`),
  createReview: (courseId: number, data: { userId: number; rating: number; content: string }) =>
    apiFetch(`/courses/${courseId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateReview: (reviewId: number, data: { userId: number; rating: number; content: string }) =>
    apiFetch(`/reviews/${reviewId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteReview: (reviewId: number, userId: number) =>
    apiFetch(`/reviews/${reviewId}?userId=${userId}`, { method: "DELETE" }),
};

// ─── 수강 히스토리 (이어보기) ───────────────────────
export const watchApi = {
  savePosition: (lessonId: number, data: { userId: number; courseId: number; positionSeconds: number }) =>
    apiFetch(`/lessons/${lessonId}/watch`, { method: "POST", body: JSON.stringify(data) }),
  getLessonPosition: (lessonId: number, userId: number) =>
    apiFetch(`/lessons/${lessonId}/watch?userId=${userId}`).catch(() => null),
};

// ─── 북마크 ────────────────────────────────────────
export const bookmarkApi = {
  getLessonBookmarks: (lessonId: number, userId: number) =>
    apiFetch(`/lessons/${lessonId}/bookmarks?userId=${userId}`),
  addBookmark: (lessonId: number, data: { userId: number; positionSeconds: number; note: string }) =>
    apiFetch(`/lessons/${lessonId}/bookmarks`, { method: "POST", body: JSON.stringify(data) }),
  deleteBookmark: (bookmarkId: number, userId: number) =>
    apiFetch(`/bookmarks/${bookmarkId}?userId=${userId}`, { method: "DELETE" }),
};

// ─── 강의 ──────────────────────────────────────────
export const courseApi = {
  delete: (courseId: number, instructorId: number) =>
    apiFetch(`/courses/${courseId}?instructorId=${instructorId}`, { method: "DELETE" }),
};

// ─── 신고 ──────────────────────────────────────────
export const reportApi = {
  report: (courseId: number, data: { userId: number; reason: string; description?: string }) =>
    apiFetch(`/courses/${courseId}/reports`, { method: "POST", body: JSON.stringify(data) }),
  getAdminReports: () => apiFetch("/admin/reports"),
  deleteCourse: (courseId: number, reason?: string) =>
    apiFetch(`/admin/courses/${courseId}${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, { method: "DELETE" }),
};

// ─── 알림 ──────────────────────────────────────────
export const notificationApi = {
  getMyNotifications: (userId: number) => apiFetch(`/users/${userId}/notifications`),
  markRead: (id: number) => apiFetch(`/notifications/${id}/read`, { method: "POST" }),
};

// ─── 관리자 사용자 관리 ────────────────────────────
export const adminApi = {
  getUsers: () => apiFetch("/admin/users"),
  getDashboard: () => apiFetch("/admin/dashboard"),
  getJobs: () => apiFetch("/admin/jobs/runs"),
  getCourses: () => apiFetch("/admin/courses"),
  updateCourseStatus: (courseId: number, status: "PUBLISHED" | "HIDDEN") =>
    apiFetch(`/admin/courses/${courseId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  deactivateUser: (userId: number) => apiFetch(`/admin/users/${userId}/deactivate`, { method: "PUT" }),
  activateUser: (userId: number) => apiFetch(`/admin/users/${userId}/activate`, { method: "PUT" }),
};

export const questionApi = {
  getCourseQuestions: (courseId: number) => apiFetch(`/courses/${courseId}/questions`),
  create: (courseId: number, data: { title: string; content: string }) =>
    apiFetch(`/courses/${courseId}/questions`, { method: "POST", body: JSON.stringify(data) }),
  getInstructorQuestions: (courseId?: number) =>
    apiFetch(`/instructor/questions${courseId ? `?courseId=${courseId}` : ""}`),
  answer: (questionId: number, answer: string) =>
    apiFetch(`/questions/${questionId}/answer`, { method: "PUT", body: JSON.stringify({ answer }) }),
};

// ─── 구독 (강사 팔로우) ────────────────────────────
export const subscriptionApi = {
  subscribe: (userId: number, instructorId: number) =>
    apiFetch("/subscriptions", { method: "POST", body: JSON.stringify({ userId, instructorId }) }),
  unsubscribe: (userId: number, instructorId: number) =>
    apiFetch(`/subscriptions?userId=${userId}&instructorId=${instructorId}`, { method: "DELETE" }),
  isSubscribed: (userId: number, instructorId: number) =>
    apiFetch(`/subscriptions/check?userId=${userId}&instructorId=${instructorId}`),
};
