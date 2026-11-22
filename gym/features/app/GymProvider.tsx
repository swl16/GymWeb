"use client";
import { createContext, useContext, type ReactNode } from "react";
import useGymController from "./useGymController";
type GymContextValue = ReturnType<typeof useGymController>;
const GymContext = createContext<GymContextValue | null>(null);
/** Owns the one application state instance shared by independent feature screens. */
export function GymProvider({
  children,
  initialModal,
}: {
  children: ReactNode;
  initialModal?: "login" | "register" | "staff-login" | "admin-login";
}) {
  const value = useGymController(initialModal);
  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}
export function useGym() {
  const value = useContext(GymContext);
  if (!value) throw new Error("useGym must be used inside GymProvider");
  return value;
}
