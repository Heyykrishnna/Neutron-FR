const AUTH_CONTINUATION_KEY = "neutron.auth.continuation";

const isBrowser = () => typeof window !== "undefined";

const normalizeNextPath = (nextPath) => {
  if (!nextPath || typeof nextPath !== "string") return "";
  const trimmed = nextPath.trim();
  if (!trimmed.startsWith("/")) return "";
  if (trimmed.startsWith("//")) return "";
  return trimmed;
};

export const getAuthContinuation = () => {
  if (!isBrowser()) {
    return { next: "", forceLogin: false };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_CONTINUATION_KEY);
    if (!raw) return { next: "", forceLogin: false };

    const parsed = JSON.parse(raw);
    return {
      next: normalizeNextPath(parsed?.next),
      forceLogin: Boolean(parsed?.forceLogin),
    };
  } catch {
    return { next: "", forceLogin: false };
  }
};

export const setAuthContinuation = ({ next, forceLogin = false }) => {
  if (!isBrowser()) return;

  const normalizedNext = normalizeNextPath(next);

  if (!normalizedNext) {
    if (!forceLogin) {
      window.localStorage.removeItem(AUTH_CONTINUATION_KEY);
      return;
    }

    window.localStorage.setItem(
      AUTH_CONTINUATION_KEY,
      JSON.stringify({ next: "", forceLogin: true }),
    );
    return;
  }

  window.localStorage.setItem(
    AUTH_CONTINUATION_KEY,
    JSON.stringify({ next: normalizedNext, forceLogin: Boolean(forceLogin) }),
  );
};

export const clearAuthContinuation = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_CONTINUATION_KEY);
};

export const buildAuthPageHref = (basePath, { next, forceLogin = false }) => {
  const params = new URLSearchParams();
  const normalizedNext = normalizeNextPath(next);

  if (normalizedNext) {
    params.set("next", normalizedNext);
  }

  if (forceLogin) {
    params.set("forceLogin", "1");
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
};
