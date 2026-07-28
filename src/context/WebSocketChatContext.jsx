/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import { listStudyRequests } from "../components/chat/studyRequestApi";
import { STUDY_REQUEST_FEATURE_ENABLED, STUDY_REQUEST_STATUS } from "../components/chat/studyRequestConfig";
import { FOLLOW_STATE_CHANGED_EVENT } from "../components/teacher/followUtils";

const CHAT_STORAGE_KEY = "saha_chat_open";
const WebSocketChatContext = createContext(null);

function getWebSocketBaseUrl() {
  const configuredBase = API?.defaults?.baseURL || import.meta.env.VITE_API_BASE_URL || "";

  try {
    if (configuredBase) {
      const parsed = new URL(configuredBase);
      const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${parsed.host}`;
    }
  } catch {
    // Fall through to window location when configured base URL is not parseable.
  }

  if (typeof window !== "undefined") {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}`;
  }

  return "ws://127.0.0.1:8000";
}

function buildSocketUrl(roomName, token) {
  const base = getWebSocketBaseUrl();
  return `${base}/ws/chat/${roomName}/?token=${token || ""}`;
}

function getStoredOpenState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CHAT_STORAGE_KEY) === "true";
}

function getRoomName(userId, contactId) {
  return `${Math.min(userId, contactId)}_${Math.max(userId, contactId)}`;
}

function toDisplayName(person) {
  const fullName = [person?.first_name, person?.last_name].filter(Boolean).join(" ").trim();
  return person?.fullName || person?.full_name || person?.name || fullName || person?.username || person?.email || "";
}

function toShortName(name, fallback = "U") {
  const initials = String(name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || fallback;
}

function normalizeChatPerson(person) {
  if (!person) return null;

  const id = person.id ?? person.user_id ?? person.pk;
  if (id === undefined || id === null || id === "") return null;

  const fullName = toDisplayName(person) || `User ${id}`;
  const role = person.role || person.user_role || "Member";
  const shortName = person.shortName || person.short_name || toShortName(fullName, String(role).slice(0, 2).toUpperCase());

  return {
    ...person,
    id,
    user_id: person.user_id ?? id,
    name: person.name || person.first_name || fullName,
    fullName,
    username: person.username || "",
    role,
    shortName,
    avatarDisplay: person.avatarDisplay || person.avatar_display || shortName,
  };
}

function normalizeChatPeople(people) {
  const uniquePeople = new Map();
  (Array.isArray(people) ? people : []).forEach((person) => {
    const normalized = normalizeChatPerson(person);
    if (normalized?.id !== undefined && normalized?.id !== null) {
      uniquePeople.set(String(normalized.id), normalized);
    }
  });
  return [...uniquePeople.values()];
}

/** Fetch message history for a room from the REST API */
async function fetchRoomHistory(roomName) {
  try {
    const { data } = await API.get(`chat/messages/${roomName}/`);
    // data is an array of { id, sender, receiver, content, timestamp }
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function WebSocketChatProvider({ children }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(getStoredOpenState);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [studyRequests, setStudyRequests] = useState([]);
  const [studyRequestLoading, setStudyRequestLoading] = useState(false);
  const [studyRequestError, setStudyRequestError] = useState("");
  const [wsStatus, setWsStatus] = useState(true); // true = connected
  const wsRef = useRef({});
  const pendingMessagesRef = useRef({});
  const historyLoadedRef = useRef(new Set());
  const isChatRoute =
    location.pathname.startsWith("/teacher") ||
    location.pathname.startsWith("/student");

  const clearChatState = useCallback(() => {
    setCurrentUser(null);
    setContacts([]);
    setMessagesByConversation({});
    setSelectedConversationId(null);
    setStudyRequests([]);
    setStudyRequestError("");
    setStudyRequestLoading(false);
    historyLoadedRef.current = new Set();
  }, []);

  const updateContacts = useCallback((nextValue) => {
    setContacts((previousContacts) => {
      const resolvedContacts = typeof nextValue === "function"
        ? nextValue(previousContacts)
        : nextValue;
      return normalizeChatPeople(resolvedContacts);
    });
  }, []);

  const refreshChatContext = useCallback(async () => {
    const token = window.localStorage.getItem("access_token");

    if (!isChatRoute || !token) {
      clearChatState();
      return;
    }

    try {
      const { data } = await API.get("chat/context/");
      const nextCurrentUser = normalizeChatPerson(data?.current_user || null);

      if (!nextCurrentUser) {
        clearChatState();
        return;
      }

      const nextContacts = normalizeChatPeople(data?.contacts);
      const nextRoomNames = new Set(
        nextContacts.map((contact) => getRoomName(nextCurrentUser.id, contact.id))
      );

      setCurrentUser(nextCurrentUser);
      setContacts(nextContacts);
      setMessagesByConversation((prev) => {
        const nextMessages = {};
        nextRoomNames.forEach((roomName) => {
          if (prev[roomName]) {
            nextMessages[roomName] = prev[roomName];
          }
        });
        return nextMessages;
      });
      historyLoadedRef.current = new Set(
        [...historyLoadedRef.current].filter((roomName) => nextRoomNames.has(roomName))
      );
      setSelectedConversationId((prev) => (
        prev && nextRoomNames.has(prev) ? prev : null
      ));

      if (STUDY_REQUEST_FEATURE_ENABLED && nextCurrentUser.role) {
        setStudyRequestLoading(true);
        try {
          const requests = await listStudyRequests(nextCurrentUser.role);
          setStudyRequests(requests);
          setStudyRequestError("");
        } catch {
          setStudyRequests([]);
          setStudyRequestError("Unable to load study requests.");
        } finally {
          setStudyRequestLoading(false);
        }
      } else {
        setStudyRequests([]);
        setStudyRequestError("");
        setStudyRequestLoading(false);
      }
    } catch {
      clearChatState();
    }
  }, [clearChatState, isChatRoute]);

  // ── Persist open/close state ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHAT_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  // ── Fetch chat context on route change ──
  useEffect(() => {
    refreshChatContext();
  }, [refreshChatContext]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleFollowStateChanged = () => {
      refreshChatContext();
    };

    window.addEventListener(FOLLOW_STATE_CHANGED_EVENT, handleFollowStateChanged);
    return () => {
      window.removeEventListener(FOLLOW_STATE_CHANGED_EVENT, handleFollowStateChanged);
    };
  }, [refreshChatContext]);

  // ── Load message history when a conversation is first opened ──
  const loadHistory = useCallback(async (roomName, userId) => {
    if (historyLoadedRef.current.has(roomName)) return;
    historyLoadedRef.current.add(roomName);

    const raw = await fetchRoomHistory(roomName);
    if (!raw.length) return;

    const messages = raw.map((msg) => ({
      id: `rest-${msg.id}`,
      // sender_id is added by the upgraded serializer; fallback to name match
      senderId: msg.sender_id ?? (msg.sender === currentUser?.name ? userId : null),
      senderName: msg.sender,
      text: msg.content,
      timestamp: msg.timestamp,
      // Mark all historical messages as read by current user since they're already loaded
      readBy: [userId],
    }));

    setMessagesByConversation((prev) => ({
      ...prev,
      [roomName]: messages,
    }));
  }, [currentUser]);

  // ── WebSocket management ──
  useEffect(() => {
    if (!currentUser) return;

    const token = window.localStorage.getItem("access_token");

    contacts.forEach((contact) => {
      const roomName = getRoomName(currentUser.id, contact.id);
      if (wsRef.current[roomName]) return; // already open

      const ws = new WebSocket(buildSocketUrl(roomName, token));

      ws.onopen = () => {
        if (wsRef.current[roomName] !== ws) return;
        setWsStatus(true);
        const pending = pendingMessagesRef.current[roomName] || [];
        if (pending.length) {
          pending.forEach((messageText) => {
            ws.send(JSON.stringify({ message: messageText }));
          });
          delete pendingMessagesRef.current[roomName];
        }
      };

      ws.onmessage = (e) => {
        if (wsRef.current[roomName] !== ws) return;
        try {
          const data = JSON.parse(e.data);
          if (data.message !== undefined && data.sender_id !== undefined) {
            setMessagesByConversation((prev) => {
              const convId = roomName;
              const prevMsgs = prev[convId] || [];
              const incomingId = data.msg_id ? `ws-${data.msg_id}` : `ws-${roomName}-${data.sender_id}-${data.timestamp || data.message}`;
              const optimisticIndex = prevMsgs.findIndex(
                (m) =>
                  m._optimistic &&
                  String(m.senderId) === String(data.sender_id) &&
                  m.text === data.message
              );

              if (prevMsgs.some((m) => m.id === incomingId)) {
                return prev;
              }

              const incoming = {
                id: incomingId,
                senderId: data.sender_id,
                senderName: data.sender,
                text: data.message,
                timestamp: data.timestamp || new Date().toISOString(),
                readBy: data.sender_id === currentUser.id ? [currentUser.id] : [],
              };

              if (optimisticIndex !== -1) {
                const nextMsgs = [...prevMsgs];
                nextMsgs[optimisticIndex] = incoming;
                return {
                  ...prev,
                  [convId]: nextMsgs,
                };
              }

              return {
                ...prev,
                [convId]: [...prevMsgs, incoming],
              };
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        if (wsRef.current[roomName] !== ws) return;
        setWsStatus(false);
      };
      ws.onclose = () => {
        if (wsRef.current[roomName] === ws) {
          delete wsRef.current[roomName];
        }
      };

      wsRef.current[roomName] = ws;
    });

    return () => {
      Object.values(wsRef.current).forEach((ws) => ws.close());
      wsRef.current = {};
    };
  }, [currentUser, contacts]);

  // ── Build conversations ──
  const conversations = useMemo(() => {
    if (!currentUser) return [];

    return contacts.map((contact) => {
      const roomName = getRoomName(currentUser.id, contact.id);
      const messages = messagesByConversation[roomName] || [];
      const lastMessage = messages[messages.length - 1] || null;
      const unreadCount = messages.filter(
        (m) => m.senderId !== currentUser.id && !m.readBy.includes(currentUser.id)
      ).length;

      return {
        id: roomName,
        name: contact.name || contact.fullName || contact.email,
        otherParticipant: contact,
        messages,
        lastMessage,
        unreadCount,
      };
    });
  }, [contacts, currentUser, messagesByConversation]);

  const unreadCount = useMemo(
    () => conversations.reduce((n, c) => n + c.unreadCount, 0),
    [conversations]
  );

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((c) => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  // ── Actions ──
  const openWidget  = () => setIsOpen(true);
  const closeWidget = () => setIsOpen(false);
  const toggleWidget = () => setIsOpen((v) => !v);

  const selectConversation = useCallback((conversationId) => {
    setSelectedConversationId(conversationId);
    setIsOpen(true);

    // Load history on first open
    if (currentUser) {
      loadHistory(conversationId, currentUser.id);
    }

    // Mark as read via WebSocket
    const ws = wsRef.current[conversationId];
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "mark_read" }));
    }

    // Mark locally
    setMessagesByConversation((prev) => {
      const msgs = prev[conversationId] || [];
      const changed = msgs.some(
        (m) => m.senderId !== currentUser?.id && !m.readBy.includes(currentUser?.id)
      );
      if (!changed) return prev;
      return {
        ...prev,
        [conversationId]: msgs.map((m) =>
          m.senderId !== currentUser?.id && !m.readBy.includes(currentUser?.id)
            ? { ...m, readBy: [...m.readBy, currentUser.id] }
            : m
        ),
      };
    });
  }, [currentUser, loadHistory]);

  const sendMessage = useCallback((text) => {
    if (!currentUser || !selectedConversationId || !text.trim()) return;

    const cleanText = text.trim();

    // Always add optimistic UI first so typing feels instant.
    const optimistic = {
      id: `opt-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: cleanText,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
      _optimistic: true,
    };

    setMessagesByConversation((prev) => ({
      ...prev,
      [selectedConversationId]: [
        ...(prev[selectedConversationId] || []),
        optimistic,
      ],
    }));

    const ws = wsRef.current[selectedConversationId];

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ message: cleanText }));
    } else {
      pendingMessagesRef.current[selectedConversationId] = [
        ...(pendingMessagesRef.current[selectedConversationId] || []),
        cleanText,
      ];
      console.warn("[WebSocket] Socket not open yet. Queued message.");
      if (!ws || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
        refreshChatContext();
      }
    }
  }, [currentUser, selectedConversationId, refreshChatContext]);

  const value = {
    currentUser,
    conversations,
    selectedConversation,
    selectedConversationId,
    isOpen,
    unreadCount,
    wsStatus,
    openWidget,
    closeWidget,
    toggleWidget,
    selectConversation,
    sendMessage,
    contacts,
    setContacts: updateContacts,
    refreshChatContext,
    requestFeatureEnabled: STUDY_REQUEST_FEATURE_ENABLED,
    requestStatuses: STUDY_REQUEST_STATUS,
    studyRequests,
    studyRequestLoading,
    studyRequestError,
  };

  return (
    <WebSocketChatContext.Provider value={value}>
      {children}
    </WebSocketChatContext.Provider>
  );
}

export function useWebSocketChat() {
  const context = useContext(WebSocketChatContext);
  if (!context) {
    throw new Error("useWebSocketChat must be used within a WebSocketChatProvider");
  }
  return context;
}