import { findOrCreateUser } from "@/api-functions/user.api";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";

// export const UserKeys = {
//   user: (id: string) => ["user", id] as const,
// };

export const useCreateUserMutation = ({
  customConfig,
}: {
  customConfig?: UseMutationOptions<any, any, { publicKey: string }>;
}) => {
  return useMutation({
    // mutationKey: UserKeys.user(publicKey),
    mutationFn: async ({ publicKey }: { publicKey: string }) => {
      return await findOrCreateUser(publicKey);
    },
    ...customConfig,
  });
};
