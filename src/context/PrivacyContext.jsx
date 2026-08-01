import { createContext, useContext, useState } from 'react';

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [hideValues, setHideValues] = useState(true);

  return (
    <PrivacyContext.Provider value={{ hideValues, setHideValues }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
