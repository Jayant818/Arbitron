import { Code, Flex, Text } from "@radix-ui/themes";
import {
  isWalletStandardError,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED,
  WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED,
} from "@wallet-standard/core";
import React from "react";

export const NO_ERROR = Symbol();

export function getErrorMessage(error: unknown, fallbackMessage: React.ReactNode): React.ReactNode {
  if (isWalletStandardError(error, WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_FEATURE_UNIMPLEMENTED)) {
    return (
      <>
        This account does not support the <Code>{error.context.featureName}</Code> feature
      </>
    );
  } else if (isWalletStandardError(error, WALLET_STANDARD_ERROR__FEATURES__WALLET_FEATURE_UNIMPLEMENTED)) {
    return (
      <Flex direction="column" gap="4">
        <Text as="p">
          The wallet '{error.context.walletName}' (
          {error.context.supportedChains.sort().map((chain, ii, { length }) => (
            <React.Fragment key={chain}>
              <Code>{chain}</Code>
              {ii === length - 1 ? null : ", "}
            </React.Fragment>
          ))}
          ) does not support the <Code>{error.context.featureName}</Code> feature.
        </Text>
        <Text as="p" trim="end">
          Features supported:
          <ul>
            {error.context.supportedFeatures.sort().map((featureName) => (
              <li key={featureName}>
                <Code>{featureName}</Code>
              </li>
            ))}
          </ul>
        </Text>
      </Flex>
    );
  } else if (isWalletStandardError(error, WALLET_STANDARD_ERROR__FEATURES__WALLET_ACCOUNT_CHAIN_UNSUPPORTED)) {
    return (
      <Flex direction="column" gap="4">
        <Text as="p">
          This account does not support the chain <Code>{error.context.chain}</Code>.
        </Text>
        <Text as="p" trim="end">
          Chains supported:
          <ul>
            {error.context.supportedChains.sort().map((chain) => (
              <li key={chain}>
                <Code>{chain}</Code>
              </li>
            ))}
          </ul>
        </Text>
      </Flex>
    );
  } else if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallbackMessage;
}
