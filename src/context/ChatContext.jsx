import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import { listStudyRequests } from "../components/chat/studyRequestApi";
import { STUDY_REQUEST_FEATURE_ENABLED, STUDY_REQUEST_STATUS } from "../components/chat/studyRequestConfig";

const CHAT_STORAGE_KEY = "saha_chat_open";

const ChatContext = createContext(null);

function getStoredOpenState() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CHAT_STORAGE_KEY) === "true";
}

function createConversationId(contact) {
  return `thread-${contact.role}-${contact.id}`;
}

function createSeedMessages(currentUser, contact) {
  const now = Date.now();
  const ownIntro = currentUser.role === "teacher"
    ? `Hello ${contact.name}, I am available here if you need help with your lessons.`
    : `Hello ${contact.name}, I am reaching out through the study chat.`;
  const contactReply = contact.role === "teacher"
    ? `Thanks ${currentUser.name}. I will review your update shortly.`
    : `Thank you ${currentUser.name}. I will send the details in a moment.`;

  return [
    {
      id: `${createConversationId(contact)}-1`,
      senderId: currentUser.id,
      text: ownIntro,
      timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      readBy: [currentUser.id, contact.id],
    },
    {
      id: `${createConversationId(contact)}-2`,
      senderId: contact.id,
      text: contactReply,
      timestamp: new Date(now - 1000 * 60 * 40).toISOString(),
      readBy: [contact.id],
    },
  ];
}

function hydrateMessages(previousMessages, currentUser, contacts) {
  if (!currentUser) return previousMessages;

  const nextMessages = {};
  contacts.forEach((contact) => {
    const conversationId = createConversationId(contact);
    nextMessages[conversationId] = previousMessages[conversationId] || createSeedMessages(currentUser, contact);
  });
  return nextMessages;
}

function sortConversations(a, b) {
  return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
}

function createConversationView(contact, messagesByConversation, currentUser) {
  const conversationId = createConversationId(contact);
  const messages = messagesByConversation[conversationId] || [];

  const lastMessage = messages[messages.length - 1] || null;

  if (!lastMessage) {
    return null;
  }

  const unreadCount = messages.filter(
    (message) => message.senderId !== currentUser.id && !message.readBy.includes(currentUser.id),
  ).length;

  return {
    id: conversationId,
    otherParticipant: contact,
    messages,
    lastMessage,
    unreadCount,
  };
}

export function ChatProvider({ children }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(getStoredOpenState);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [studyRequests, setStudyRequests] = useState([]);
  const [studyRequestLoading, setStudyRequestLoading] = useState(false);
  const [studyRequestError, setStudyRequestError] = useState("");

  useEffect(() => {
    const isChatRoute = location.pathname.startsWith("/teacher") || location.pathname.startsWith("/student");
    const token = window.localStorage.getItem("access_token");

    if (!isChatRoute || !token) {
      setCurrentUser(null);
      setContacts([]);
      setMessagesByConversation({});
      setSelectedConversationId(null);
      setStudyRequests([]);
      setStudyRequestError("");
      return;
    }

    let isCancelled = false;

    const fetchChatContext = async () => {
      try {
        const { data } = await API.get("chat/context/");
        if (isCancelled) return;

        const nextCurrentUser = data?.current_user || null;
        const nextContacts = Array.isArray(data?.contacts) ? data.contacts : [];

        setCurrentUser(nextCurrentUser);
        setContacts(nextContacts);
        setMessagesByConversation((previousMessages) => hydrateMessages(previousMessages, nextCurrentUser, nextContacts));

        if (STUDY_REQUEST_FEATURE_ENABLED && nextCurrentUser?.role) {
          setStudyRequestLoading(true);
          try {
            const requests = await listStudyRequests(nextCurrentUser.role);
            if (!isCancelled) {
              setStudyRequests(requests);
              setStudyRequestError("");
            }
          } catch {
            if (!isCancelled) {
              setStudyRequests([]);
              setStudyRequestError("Unable to load study requests.");
            }
          } finally {
            if (!isCancelled) {
              setStudyRequestLoading(false);
            }
          }
        } else {
          setStudyRequests([]);
          setStudyRequestError("");
          setStudyRequestLoading(false);
        }
      } catch {
        if (isCancelled) return;
        setCurrentUser(null);
        setContacts([]);
        setMessagesByConversation({});
        setSelectedConversationId(null);
        setStudyRequests([]);
        setStudyRequestError("");
        setStudyRequestLoading(false);
      }
    };

    fetchChatContext();

    return () => {
      isCancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CHAT_STORAGE_KEY, String(isOpen));
  }, [isOpen]);

  const conversations = useMemo(() => {
    if (!currentUser) return [];

    return contacts
      .map((contact) => createConversationView(contact, messagesByConversation, currentUser))
      .filter(Boolean)
      .sort(sortConversations);
  }, [contacts, currentUser, messagesByConversation]);

  const unreadCount = useMemo(
    () => conversations.reduce((count, conversation) => count + conversation.unreadCount, 0),
    [conversations],
  );

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((conversation) => conversation.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (!conversations.length) {
      setSelectedConversationId(null);
      return;
    }

    if (selectedConversationId && conversations.some((conversation) => conversation.id === selectedConversationId)) {
      return;
    }

    setSelectedConversationId(conversations[0].id);
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (!currentUser || !selectedConversationId || !isOpen) return;

    setMessagesByConversation((currentMessages) => {
      const threadMessages = currentMessages[selectedConversationId] || [];
      let changed = false;
      const nextMessages = threadMessages.map((message) => {
        if (message.readBy.includes(currentUser.id)) {
          return message;
        }

        changed = true;
        return {
          ...message,
          readBy: [...message.readBy, currentUser.id],
        };
      });

      if (!changed) {
        return currentMessages;
      }

      return {
        ...currentMessages,
        [selectedConversationId]: nextMessages,
      };
    });
  }, [currentUser, isOpen, selectedConversationId]);

  const openWidget = () => setIsOpen(true);
  const closeWidget = () => setIsOpen(false);
  const toggleWidget = () => setIsOpen((value) => !value);

  const selectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
    setIsOpen(true);
  };

  const sendMessage = (text) => {
    if (!currentUser || !selectedConversationId || !text.trim()) {
      return;
    }

    const message = {
      id: `message-${Date.now()}`,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
    };

    setMessagesByConversation((currentMessages) => ({
      ...currentMessages,
      [selectedConversationId]: [...(currentMessages[selectedConversationId] || []), message],
    }));
  };

  const value = {
    currentUser,
    conversations,
    selectedConversation,
    selectedConversationId,
    isOpen,
    unreadCount,
    openWidget,
    closeWidget,
    toggleWidget,
    selectConversation,
    sendMessage,
    requestFeatureEnabled: STUDY_REQUEST_FEATURE_ENABLED,
    requestStatuses: STUDY_REQUEST_STATUS,
    studyRequests,
    studyRequestLoading,
    studyRequestError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
}