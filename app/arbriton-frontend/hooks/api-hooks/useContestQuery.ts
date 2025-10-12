import {
  fetchContestDetailsById,
  getAllContests,
  IContest,
} from "@/api-functions/contest.api";
import { APIError } from "@/lib/errors";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const contestKeys = {
  all: ["contests"] as const,
  contestById: (id: string) => ["contests", "id", id] as const,
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
