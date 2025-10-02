import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import { createContext } from "react";

export type SelectedWalletAccountState = { wallet: UiWallet; account: UiWalletAccount } | undefined;

export const SelectedWalletAccountContext = createContext<
  readonly [
    selectedWalletAccount: SelectedWalletAccountState,
    setSelectedWalletAccount: React.Dispatch<React.SetStateAction<SelectedWalletAccountState>>,
  ]
>([
  undefined /* selectedWalletAccount */,
  function setSelectedWalletAccount() {
    /* empty */
  },
]);
