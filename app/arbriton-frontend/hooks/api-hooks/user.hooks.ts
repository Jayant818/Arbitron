
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GetUser, UpdateUser } from "@/api-functions/user.api";
import { useWallet } from "@solana/wallet-adapter-react";

export const useUser = () => {
    const { publicKey } = useWallet();
    const walletAddress = publicKey?.toBase58();

    return useQuery({
        queryKey: ["user", walletAddress],
        queryFn: () => GetUser(walletAddress!),
        enabled: !!walletAddress,
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const { publicKey } = useWallet();
    const walletAddress = publicKey?.toBase58();

    return useMutation({
        mutationFn: (data: { walletAddress: string; username?: string; email?: string }) => UpdateUser(data),
        onSuccess: (data) => {
            queryClient.setQueryData(["user", walletAddress], data);
        },
    });
};
