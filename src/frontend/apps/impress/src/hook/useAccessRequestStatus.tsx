import { useQuery } from '@tanstack/react-query';

import { fetchAPI } from '@/api';

type AccessRequestStatusResponse = {
  has_requested: boolean;
};

export function useAccessRequestStatus(documentId: string | null) {
  return useQuery({
    queryKey: ['access-request-status', documentId],
    enabled: !!documentId,
    queryFn: async () => {
      const response = await fetchAPI(
        `documents/${documentId}/has-requested-access`,
      );
      const data = (await response.json()) as AccessRequestStatusResponse;
      return data.has_requested;
    },
  });
}
