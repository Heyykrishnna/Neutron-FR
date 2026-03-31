import React from "react";

export const DashboardContext = React.createContext<{
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  setExpandedID: (val: boolean) => void;
}>({
  showToast: () => {},
  setExpandedID: () => {},
});

export function useDashboard() {
  return React.useContext(DashboardContext);
}
