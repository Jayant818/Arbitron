import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GetUser,
  UpdateUser,
  GetUserContestHistory,
} from "@/api-functions/user.api";
import { useSolana } from "@/components/solana-provider";

export const useUser = () => {
  const { selectedAccount } = useSolana();
  const walletAddress = selectedAccount?.address;

  return useQuery({
    queryKey: ["user", walletAddress],
    queryFn: () => GetUser(walletAddress!),
    enabled: !!walletAddress,
  });
};

export const useUserContestHistory = () => {
  const { selectedAccount } = useSolana();
  const walletAddress = selectedAccount?.address;

  return useQuery({
    queryKey: ["userContestHistory", walletAddress],
    queryFn: () => GetUserContestHistory(walletAddress!),
    enabled: !!walletAddress,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { selectedAccount } = useSolana();
  const walletAddress = selectedAccount?.address;

  return useMutation({
    mutationFn: (data: {
      walletAddress: string;
      username?: string;
      email?: string;
    }) => UpdateUser(data),
    onSuccess: (data) => {
      queryClient.setQueryData(["user", walletAddress], data);
    },
  });
};
