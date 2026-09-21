// BC-Mobile-1A — shared control for the SINGLE global V action sheet.
//
// The V sheet instance lives exactly once in BusinessConnectMobileShell
// (BC-Mobile-0B frozen contract). This context lets surfaces (e.g. the Home
// "Mở V" entry) open THAT instance instead of creating a second V
// implementation. Default is a no-op so components render safely in isolation.

import { createContext, useContext } from "react";

export type VSheetControls = {
  openV: () => void;
};

export const VSheetContext = createContext<VSheetControls>({
  openV: () => {},
});

export function useVSheet(): VSheetControls {
  return useContext(VSheetContext);
}
