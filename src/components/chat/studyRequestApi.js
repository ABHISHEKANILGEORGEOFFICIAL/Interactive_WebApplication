import API from "../../api";
import { STUDY_REQUEST_ENDPOINTS, STUDY_REQUEST_FEATURE_ENABLED } from "./studyRequestConfig";

const normalizeStudyRequestList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.requests)) return payload.requests;
  return [];
};

export async function listStudyRequests(role) {
  if (!STUDY_REQUEST_FEATURE_ENABLED) return [];

  const endpoint = role === "teacher"
    ? STUDY_REQUEST_ENDPOINTS.listIncoming
    : STUDY_REQUEST_ENDPOINTS.listOutgoing;
  const { data } = await API.get(endpoint);
  return normalizeStudyRequestList(data);
}

export async function createStudyRequest(payload) {
  if (!STUDY_REQUEST_FEATURE_ENABLED) return null;
  const { data } = await API.post(STUDY_REQUEST_ENDPOINTS.create, payload);
  return data;
}

export async function decideStudyRequest(requestId, status) {
  if (!STUDY_REQUEST_FEATURE_ENABLED) return null;
  const { data } = await API.post(STUDY_REQUEST_ENDPOINTS.decision(requestId), { status });
  return data;
}