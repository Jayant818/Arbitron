import {
  fetchAllTokens,
  fetchTokenPrice,
  fetchTokenPriceByCategory,
  Token,
  TokenCategory,
} from "@/api-functions/allTokens.api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";

export const TokensKeys = {
  all: ["tokens"] as const,
  byCategory: (category: string) => ["tokens", "category", category] as const,
  getTokens: (mintAddresses: string[]) =>
    ["tokens", "prices", ...mintAddresses] as const,
};

export const useGetAllTokenQuery = (
  customConfig?: UseQueryOptions<Token[], ApiError>
) => {
  return useQuery({
    queryKey: TokensKeys.all,
    queryFn: fetchAllTokens,
    throwOnError: true,
    ...customConfig,
  });
};

export const useGetTokensByCategoryQuery = (
  category: TokenCategory,
  customConfig?: UseQueryOptions<Token[], ApiError>
) => {
  return useQuery({
    queryKey: TokensKeys.byCategory(category),
    queryFn: () => fetchTokenPriceByCategory(category),
    throwOnError: true,
    ...customConfig,
  });
};

export const useGetTokenPrice = (
  mintAddresses: string[],
  customConfig?: UseQueryOptions<Token[], ApiError>
) => {
  return useQuery({
    queryKey: TokensKeys.getTokens(mintAddresses),
    queryFn: () => fetchTokenPrice(mintAddresses),
    throwOnError: true,
    ...customConfig,
  });
};
