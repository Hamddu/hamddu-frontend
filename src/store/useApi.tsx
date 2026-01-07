import { useQuery } from "@tanstack/react-query";
import { testApi } from "../api/test.api";

export function useTestData() {
  return useQuery({
    queryKey: ["testData"],
    queryFn: () => testApi.getTestList(),
  });
}
