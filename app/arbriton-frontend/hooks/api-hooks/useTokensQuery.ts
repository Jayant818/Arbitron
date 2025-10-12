import {
  fetchAllTokens,
  fetchTokenPriceByCategory,
  Token,
  TokenCategory,
} from "@/api-functions/allTokens.api";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";

export const TokensKeys = {
  all: ["tokens"] as const,
  byCategory: (category: string) => ["tokens", "category", category] as const,
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
