export const ACTIVITY_NOTIFICATION_EVENT = "saha:activity-notification";

export function emitActivityNotification(payload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ACTIVITY_NOTIFICATION_EVENT, {
      detail: {
        id: payload?.id,
        kind: payload?.kind || "activity",
        text: payload?.text || "New activity",
        at: payload?.at || new Date().toISOString(),
        postId: payload?.postId ?? null,
      },
    })
  );
}
