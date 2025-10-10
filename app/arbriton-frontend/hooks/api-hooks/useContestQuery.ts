import { getAllContests, IContest } from "@/api-functions/contest.api";
import { APIError } from "@/lib/errors";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export const contestKeys = {
  all: ["contests"] as const,
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
