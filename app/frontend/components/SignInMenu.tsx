import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Callout, DropdownMenu } from "@radix-ui/themes";
import { SolanaSignIn } from "@solana/wallet-standard-features";
import type { UiWallet } from "@wallet-standard/react";
import { useWallets } from "@wallet-standard/react";
import { useContext, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
import { ErrorDialog } from "./ErrorDialog";
import { SignInMenuItem } from "./SignInMenuItem";
import { UnconnectableWalletMenuItem } from "./UnconnectableWalletMenuItem";

type Props = Readonly<{
  children: React.ReactNode;
}>;

export function SignInMenu({ children }: Props) {
  const { current: NO_ERROR } = useRef(Symbol());
  const wallets = useWallets();
  const [, setSelectedWalletAccount] = useContext(SelectedWalletAccountContext);
  const [error, setError] = useState(NO_ERROR);
  const [forceClose, setForceClose] = useState(false);
  function renderItem(wallet: UiWallet) {
    return (
      <ErrorBoundary
        fallbackRender={({ error }) => <UnconnectableWalletMenuItem error={error} wallet={wallet} />}
        key={`wallet:${wallet.name}`}
      >
        <SignInMenuItem
          onSignIn={(account, wallet) => {
            if (account) {
              setSelectedWalletAccount({ wallet, account });
            } else {
              setSelectedWalletAccount(undefined);
            }
            setForceClose(true);
          }}
          onError={setError}
          wallet={wallet}
        />
      </ErrorBoundary>
    );
  }
  const walletsThatSupportSignInWithSolana = [];
  for (const wallet of wallets) {
    if (SolanaSignIn in wallet.features) {
      walletsThatSupportSignInWithSolana.push(wallet);
    }
  }
  return (
    <>
      <DropdownMenu.Root open={forceClose ? false : undefined} onOpenChange={setForceClose.bind(null, false)}>
        <DropdownMenu.Trigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-display tracking-wide border border-electric-teal text-electric-teal hover:bg-electric-teal hover:text-quantum-void glow-teal h-8 px-3">
          {children}
          <DropdownMenu.TriggerIcon />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {walletsThatSupportSignInWithSolana.length === 0 ? (
            <Callout.Root color="orange" highContrast>
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>
                This browser has no wallets installed that support{" "}
                <a href="https://phantom.app/learn/developers/sign-in-with-solana" target="_blank">
                  Sign In With Solana
                </a>
                .
              </Callout.Text>
            </Callout.Root>
          ) : (
            walletsThatSupportSignInWithSolana.map(renderItem)
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {error !== NO_ERROR ? <ErrorDialog error={error} onClose={() => setError(NO_ERROR)} /> : null}
    </>
  );
}
