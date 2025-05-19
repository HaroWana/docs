import { APIError, errorCauses, fetchAPI } from '@/api';

export async function requestDocumentAccess(documentId: string): Promise<void> {
  const response = await fetchAPI(`documents/${documentId}/request-access/`, {
    method: 'POST',
    body: JSON.stringify({ documentId }),
  });

  if (!response.ok) {
    throw new APIError(
      'Failed to request document access',
      await errorCauses(response),
    );
  }
}
