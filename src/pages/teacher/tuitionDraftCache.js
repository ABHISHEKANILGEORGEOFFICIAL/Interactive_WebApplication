const CACHE_KEY = "saha_tuition_created_drafts";

const readDrafts = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDrafts = (drafts) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(drafts.slice(0, 30)));
};

const getId = (value) => String(value?.id ?? value?.pk ?? value?.tuition_id ?? value ?? "");

const getSignature = (item) => {
  const subject = String(item?.subject ?? item?.subject_id ?? item?.subjectid ?? "").trim();
  const title = String(item?.title ?? item?.name ?? item?.class_name ?? "").trim().toLowerCase();
  const grade = String(item?.grade ?? item?.class_level ?? item?.level ?? "").trim().toLowerCase();
  return `${subject}::${title}::${grade}`;
};

const hasDaysData = (item) => {
  const days = item?.class_days ?? item?.days ?? item?.classDays;
  return (Array.isArray(days) && days.length) || (typeof days === "string" && days.trim());
};

export const saveCreatedTuitionDraft = (payload, responseData) => {
  const draft = {
    id: getId(responseData),
    signature: getSignature({
      subject: responseData?.subject ?? payload?.subject,
      title: responseData?.title ?? payload?.title,
      grade: responseData?.grade ?? payload?.grade,
    }),
    class_days: responseData?.class_days ?? payload?.class_days ?? [],
    start_time: responseData?.start_time ?? payload?.start_time ?? "",
    end_time: responseData?.end_time ?? payload?.end_time ?? "",
    meeting_link: responseData?.meeting_link ?? payload?.meeting_link ?? "",
    createdAt: Date.now(),
  };

  if (!draft.signature) return;

  const drafts = readDrafts().filter((entry) => entry?.signature !== draft.signature && entry?.id !== draft.id);
  drafts.unshift(draft);
  writeDrafts(drafts);
};

export const mergeTuitionDraft = (item) => {
  if (!item) return item;

  const id = getId(item);
  const signature = getSignature(item);
  const draft = readDrafts().find((entry) => (id && entry?.id === id) || (signature && entry?.signature === signature));

  if (!draft) return item;

  const hasStart = Boolean(item?.start_time || item?.startTime);
  const hasEnd = Boolean(item?.end_time || item?.endTime);

  return {
    ...draft,
    ...item,
    class_days: hasDaysData(item) ? item.class_days ?? item.days ?? item.classDays : draft.class_days,
    start_time: hasStart ? item?.start_time ?? item?.startTime : draft.start_time,
    end_time: hasEnd ? item?.end_time ?? item?.endTime : draft.end_time,
    meeting_link: item?.meeting_link ?? draft.meeting_link,
  };
};