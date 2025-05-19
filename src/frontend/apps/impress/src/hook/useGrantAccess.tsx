import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

import { useCreateDocAccess } from '@/features/docs/doc-share';
import { Role } from '@/features/docs';
import { useModal } from '@openfun/cunningham-react';

export function useGrantAccess(
  documentId: string | null
) {
  const router = useRouter();
  const grantUserId = router.query.grant as string | undefined;
  const hasRun = useRef(false);
  const { mutateAsync: createDocAccess } = useCreateDocAccess();

  useEffect(() => {
    if (!documentId || !grantUserId || hasRun.current || !documentId) {
      return;
    }

    hasRun.current = true;

    const runGrant = async () => {
      try {
        await createDocAccess({
          docId: documentId,
          memberId: grantUserId,
          role: Role.READER,
        });
      } catch (err) {
        console.error('Grant access failed:', err);
      } finally {
        const { grant: _grant, ...rest } = router.query;
        await router.replace(
          {
            pathname: router.pathname,
            query: { ...rest },
          },
          undefined,
          { shallow: true },
        );
      }
    };

    void runGrant();
  }, [documentId, grantUserId, router]);
}
