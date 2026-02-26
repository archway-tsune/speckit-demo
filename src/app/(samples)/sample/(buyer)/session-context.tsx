'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface SessionInfo {
  role: 'buyer' | 'admin' | null;
}

const SessionContext = createContext<SessionInfo>({ role: null });

export function SessionProvider({ role, children }: { role: 'buyer' | 'admin' | null; children: ReactNode }) {
  return <SessionContext.Provider value={{ role }}>{children}</SessionContext.Provider>;
}

export function useSessionRole() {
  return useContext(SessionContext).role;
}
