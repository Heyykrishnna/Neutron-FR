import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getRoleColor(role) {
  const colors = {
    SA: "bg-red-500/10 text-red-500 border-red-500/20",
    DH: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    VH: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    VOL: "bg-green-500/10 text-green-500 border-green-500/20",
    PART: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  };
  return colors[role] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
