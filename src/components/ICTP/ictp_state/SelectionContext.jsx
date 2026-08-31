import { createContext, useContext, useMemo, useState } from 'react';

const SelectionContext = createContext(null);

// Single shared "which satellite is selected" state so the globe, skyplot,
// table, and charts all stay in sync no matter which one the user clicked.
export function SelectionProvider({ children }) {
  const [selectedPrn, setSelectedPrn] = useState(null);
  const value = useMemo(() => ({ selectedPrn, setSelectedPrn }), [selectedPrn]);
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelection must be used within a SelectionProvider');
  return ctx;
}
