import { ICreateContest } from "@/api-functions/contest.api";
import { createParticipantForContest } from "@/api-functions/participant.api";
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

export const useCreateParticipantMutation = ({
  customConfig,
}: {
  customConfig?: UseMutationOptions<
    any,
    any,
    { contestId: string; userPublickey: string }
  >;
}) => {
  return useMutation({
    mutationFn: async ({
      contestId,
      userPublickey,
      tokens,
    }: {
      contestId: string;
      userPublickey: string;
      tokens: ICreateContest[];
    }) => {
      return createParticipantForContest(contestId, userPublickey, tokens);
    },
  });
};
