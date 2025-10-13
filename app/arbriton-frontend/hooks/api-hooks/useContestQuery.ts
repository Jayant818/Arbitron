import {
  createNewContest,
  fetchContestDetailsById,
  getAllContests,
  getAllParticipantsForContest,
  IContest,
  ICreateContest,
} from "@/api-functions/contest.api";
import { APIError } from "@/lib/errors";
import {
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { ApiError } from "next/dist/server/api-utils";

export const contestKeys = {
  all: ["contests"] as const,
  contestById: (id: string) => ["contests", "id", id] as const,
  participantsByContestId: (contestId: string) =>
    ["contests", "participants", "contestId", contestId] as const,
};

export const useGetAllContestsQuery = (
  customConfig?: UseQueryOptions<IContest[], APIError>
) => {
  return useQuery({
    queryKey: contestKeys.all,
    queryFn: async () => getAllContests(),
    throwOnError: true,
    ...customConfig,
  });
};

export const useGetContestByIdQuery = ({
  id,
  customConfig,
}: {
  id: string;
  customConfig?: Omit<UseQueryOptions<IContest, APIError>, "queryKey">;
}) => {
  return useQuery({
    queryKey: contestKeys["contestById"](id),
    queryFn: async () => {
      return fetchContestDetailsById(id);
    },
    throwOnError: true,
    ...customConfig,
  });
};

export const useGetAllParticipantsForContest = ({
  contestId,
  customConfig,
}: {
  contestId: string;
  customConfig?: Omit<UseQueryOptions<any, APIError>, "queryKey">;
}) => {
  return useQuery({
    queryKey: contestKeys["participantsByContestId"](contestId),
    queryFn: async () => {
      return getAllParticipantsForContest(contestId);
    },
    throwOnError: true,
    ...customConfig,
  });
};

export const useCreateContestMutation = ({
  customConfig,
}: {
  customConfig: UseMutationOptions<any, ApiError, ICreateContest>;
}) => {
  return useMutation({
    mutationFn: async (data: ICreateContest) => {
      return createNewContest(data);
    },
    ...customConfig,
  });
};
