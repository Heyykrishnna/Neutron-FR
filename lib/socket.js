import { io } from "socket.io-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

const SOCKET_GRACE_MS = Number.parseInt(
  process.env.NEXT_PUBLIC_SOCKET_RECONNECT_GRACE_MS || "7000",
  10,
);

let socket = null;
let connected = false;
let initialized = false;
let lastDisconnectedAt = null;
let listeners = {
  onForceLogout: null,
  onConnect: null,
  onDisconnect: null,
  onConnectError: null,
};

const isPublicSocketError = (error) => {
  const code = error?.data?.code || error?.code || "";
  return code === "UNAUTHORIZED";
};

const setConnected = (nextConnected) => {
  connected = nextConnected;
  if (!nextConnected) {
    lastDisconnectedAt = Date.now();
  } else {
    lastDisconnectedAt = null;
  }
};

export const initSocket = ({
  onForceLogout,
  onConnect,
  onDisconnect,
  onConnectError,
} = {}) => {
  listeners = {
    onForceLogout: onForceLogout || null,
    onConnect: onConnect || null,
    onDisconnect: onDisconnect || null,
    onConnectError: onConnectError || null,
  };

  if (initialized && socket) {
    return socket;
  }

  socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 10000,
  });

  socket.on("connect", () => {
    setConnected(true);
    listeners.onConnect?.();
  });

  socket.on("disconnect", (reason) => {
    setConnected(false);
    listeners.onDisconnect?.(reason);
  });

  socket.on("connect_error", (error) => {
    setConnected(false);
    listeners.onConnectError?.(error);

    if (isPublicSocketError(error)) {
      listeners.onForceLogout?.({
        code: "UNAUTHORIZED",
        reason: "UNAUTHORIZED",
      });
    }
  });

  socket.on("force_logout", (payload) => {
    listeners.onForceLogout?.(payload);
  });

  initialized = true;
  return socket;
};

export const connectSocket = () => {
  if (!socket) return;
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
};

export const getSocket = () => socket;

export const isSocketConnected = () => connected;

export const isSocketConnectionAllowed = () => {
  if (connected) return true;
  if (!lastDisconnectedAt) return false;
  return Date.now() - lastDisconnectedAt <= SOCKET_GRACE_MS;
};

export const waitForSocketConnection = async (timeoutMs = 2500) => {
  if (!socket) return false;
  if (socket.connected) return true;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve(true);
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      socket.off("connect", onConnect);
    };

    socket.on("connect", onConnect);
  });
};
