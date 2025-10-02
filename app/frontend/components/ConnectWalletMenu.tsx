import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Button, Callout, DropdownMenu } from "@radix-ui/themes";
import { StandardConnect, StandardDisconnect } from "@wallet-standard/core";
import type { UiWallet } from "@wallet-standard/react";
import { uiWalletAccountBelongsToUiWallet, useWallets } from "@wallet-standard/react";
import { useContext, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
import { ConnectWalletMenuItem } from "./ConnectWalletMenuItem";
import { ErrorDialog } from "./ErrorDialog";
import { UnconnectableWalletMenuItem } from "./UnconnectableWalletMenuItem";
import { WalletAccountIcon } from "./WalletAccountIcon";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export function ConnectWalletMenu({ children }: Props) {
  const { current: NO_ERROR } = useRef(Symbol());
  const wallets = useWallets();
  const [selectedWalletAccount, setSelectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const [error, setError] = useState(NO_ERROR);
  const [forceClose, setForceClose] = useState(false);
  function renderItem(wallet: UiWallet, index: number) {
    return (
      <ErrorBoundary
        fallbackRender={({ error }) => <UnconnectableWalletMenuItem error={error} wallet={wallet} />}
        key={`wallet:${wallet.name}:${index}:${wallet.version || 'unknown'}`}
      >
        <ConnectWalletMenuItem
          onAccountSelect={(account, wallet) => {
            setSelectedWalletAccount({ wallet, account });
            setForceClose(true);
          }}
          onDisconnect={(wallet) => {
            if (selectedWalletAccount && uiWalletAccountBelongsToUiWallet(selectedWalletAccount.account, wallet)) {
              setSelectedWalletAccount(undefined);
            }
          }}
          onError={setError}
          wallet={wallet}
        />
      </ErrorBoundary>
    );
  }
  
  // Deduplicate wallets by name, keeping the most connected or newest version
  function deduplicateWallets(walletList: readonly UiWallet[]): UiWallet[] {
    const walletMap = new Map<string, UiWallet>();
    
    for (const wallet of walletList) {
      const existingWallet = walletMap.get(wallet.name);
      
      if (!existingWallet) {
        // First wallet with this name
        walletMap.set(wallet.name, wallet);
      } else {
        // Choose the wallet with more accounts (connected), or the newer version
        const shouldReplace = 
          wallet.accounts.length > existingWallet.accounts.length ||
          (wallet.accounts.length === existingWallet.accounts.length && 
           (wallet.version || '0') > (existingWallet.version || '0'));
           
        if (shouldReplace) {
          walletMap.set(wallet.name, wallet);
        }
      }
    }
    
    return Array.from(walletMap.values());
  }
  
  const deduplicatedWallets = deduplicateWallets(wallets);
  const walletsThatSupportStandardConnect = [];
  const unconnectableWallets = [];
  for (const wallet of deduplicatedWallets) {
    if (wallet.features.includes(StandardConnect) && wallet.features.includes(StandardDisconnect)) {
      walletsThatSupportStandardConnect.push(wallet);
    } else {
      unconnectableWallets.push(wallet);
    }
  }
  return (
    <>
      <DropdownMenu.Root open={forceClose ? false : undefined} onOpenChange={setForceClose.bind(null, false)}>
        <DropdownMenu.Trigger>
          <div>

          {/* <Button>
            {selectedWalletAccount ? (
              <>
                <WalletAccountIcon account={selectedWalletAccount.account} width="18" height="18" />
                {selectedWalletAccount.account.address.slice(0, 8)}
              </>
            ) : (
              children
            )}
          </Button> */}
          {children}
            {/* <DropdownMenu.TriggerIcon /> */}
          </div>

        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {wallets.length === 0 ? (
            <Callout.Root color="orange" highContrast>
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>This browser has no wallets installed.</Callout.Text>
            </Callout.Root>
          ) : (
            <>
              {walletsThatSupportStandardConnect.map((wallet, index) => renderItem(wallet, index))}
              {unconnectableWallets.length ? (
                <>
                  <DropdownMenu.Separator />
                  {unconnectableWallets.map((wallet, index) => renderItem(wallet, index + walletsThatSupportStandardConnect.length))}
                </>
              ) : null}
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {error !== NO_ERROR ? <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} /> : null}
    </>
  );
}
