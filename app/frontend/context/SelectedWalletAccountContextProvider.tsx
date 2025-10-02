import {
  getUiWalletAccountStorageKey,
  UiWallet,
  UiWalletAccount,
  uiWalletAccountBelongsToUiWallet,
  uiWalletAccountsAreSame,
  useWallets,
} from '@wallet-standard/react';
import { useEffect, useMemo, useState } from 'react';

import { SelectedWalletAccountContext, SelectedWalletAccountState } from './SelectedWalletAccountContext';
import { localStorage } from '../lib/storage';

const STORAGE_KEY = 'solana-wallet-standard-example-react:selected-wallet-and-address';

let wasSetterInvoked = false;
function getSavedWalletAccount(wallets: readonly UiWallet[]): SelectedWalletAccountState {
  if (wasSetterInvoked) {
      // After the user makes an explicit choice of wallet, stop trying to auto-select the
      // saved wallet, if and when it appears.
      return undefined;
  }
  const savedWalletNameAndAddress = localStorage.getItem(STORAGE_KEY);
  if (!savedWalletNameAndAddress || typeof savedWalletNameAndAddress !== 'string') {
      return undefined;
  }
  const [savedWalletName, savedAccountAddress] = savedWalletNameAndAddress.split(':');
  if (!savedWalletName || !savedAccountAddress) {
      return undefined;
  }
  for (const wallet of wallets) {
      if (wallet.name === savedWalletName) {
          for (const account of wallet.accounts) {
              if (account.address === savedAccountAddress) {
                  return { wallet, account };
              }
          }
      }
  }
  return undefined;
}

/**
* Saves the selected wallet account's storage key to the browser's local storage. In future
* sessions it will try to return that same wallet account, or at least one from the same brand of
* wallet if the wallet from which it came is still in the Wallet Standard registry.
*/
export function SelectedWalletAccountContextProvider({ children }: { children: React.ReactNode }) {
  const wallets = useWallets();
  const [selectedWalletAccount, setSelectedWalletAccountInternal] = useState<SelectedWalletAccountState>(() =>
      getSavedWalletAccount(wallets),
  );
  const setSelectedWalletAccount: React.Dispatch<
      React.SetStateAction<SelectedWalletAccountState>
  > = setStateAction => {
      setSelectedWalletAccountInternal(prevSelectedWalletAccount => {
          wasSetterInvoked = true;
          const nextWalletAccount =
              typeof setStateAction === 'function' ? setStateAction(prevSelectedWalletAccount) : setStateAction;
          const accountKey = nextWalletAccount ? getUiWalletAccountStorageKey(nextWalletAccount.account) : undefined;
          if (accountKey) {
              localStorage.setItem(STORAGE_KEY, accountKey);
          } else {
              localStorage.removeItem(STORAGE_KEY);
          }
          return nextWalletAccount;
      });
  };
  useEffect(() => {
      const savedWalletAccount = getSavedWalletAccount(wallets);
      if (savedWalletAccount) {
          setSelectedWalletAccountInternal(savedWalletAccount);
      }
  }, [wallets]);
  const walletAccount = useMemo(() => {
      if (selectedWalletAccount) {
          for (const uiWallet of wallets) {
              for (const uiWalletAccount of uiWallet.accounts) {
                  if (uiWalletAccountsAreSame(selectedWalletAccount.account, uiWalletAccount)) {
                      return selectedWalletAccount;
                  }
              }
              if (uiWalletAccountBelongsToUiWallet(selectedWalletAccount.account, uiWallet) && uiWallet.accounts[0]) {
                  // If the selected account belongs to this connected wallet, at least, then
                  // select one of its accounts.
                  return { wallet: uiWallet, account: uiWallet.accounts[0] };
              }
          }
      }
      return undefined;
  }, [selectedWalletAccount, wallets]);
  useEffect(() => {
      // If there is a selected wallet account but the wallet to which it belongs has since
      // disconnected, clear the selected wallet.
      if (selectedWalletAccount && !walletAccount) {
          setSelectedWalletAccountInternal(undefined);
      }
  }, [selectedWalletAccount, walletAccount]);
  return (
      <SelectedWalletAccountContext.Provider
          value={useMemo(() => [walletAccount, setSelectedWalletAccount], [walletAccount])}
      >
          {children}
      </SelectedWalletAccountContext.Provider>
  );
}