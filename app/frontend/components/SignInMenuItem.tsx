import { DropdownMenu } from "@radix-ui/themes";
import { useSignIn } from "@solana/react";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import React, { useCallback, useState } from "react";

import { WalletMenuItemContent } from "./WalletMenuItemContent";

type Props = Readonly<{
  onError(error: unknown): void;
  onSignIn(account: UiWalletAccount | undefined, wallet: UiWallet): void;
  wallet: UiWallet;
}>;

export function SignInMenuItem({ onSignIn, onError, wallet }: Props) {
  const signIn = useSignIn(wallet);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const handleSignInClick = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      try {
        setIsSigningIn(true);
        try {
          const { account } = await signIn({
            statement: "You will enjoy being signed in.",
          });
          onSignIn(account, wallet);
        } finally {
          setIsSigningIn(false);
        }
      } catch (error) {
        onError(error);
      }
    },
    [signIn, onSignIn, onError, wallet],
  );
  return (
    <DropdownMenu.Item onClick={handleSignInClick}>
      <WalletMenuItemContent loading={isSigningIn} wallet={wallet} />
    </DropdownMenu.Item>
  );
}
