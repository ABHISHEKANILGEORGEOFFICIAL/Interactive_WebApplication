export const STUDY_REQUEST_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
};

export const STUDY_REQUEST_STATUS_LABEL = {
  [STUDY_REQUEST_STATUS.PENDING]: "Pending",
  [STUDY_REQUEST_STATUS.ACCEPTED]: "Accepted",
  [STUDY_REQUEST_STATUS.REJECTED]: "Rejected",
};

export const STUDY_REQUEST_FEATURE_ENABLED = import.meta.env.VITE_ENABLE_CHAT_REQUESTS === "true";

export const STUDY_REQUEST_ENDPOINTS = {
  listIncoming: "study-requests/incoming/",
  listOutgoing: "study-requests/outgoing/",
  create: "study-requests/",
  decision: (requestId) => `study-requests/${requestId}/decision/`,
};