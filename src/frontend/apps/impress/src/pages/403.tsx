import { Button } from '@openfun/cunningham-react';
import { useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import img403 from '@/assets/icons/icon-403.png';
import { Box, Icon, StyledLink, Text } from '@/components';
import { useAccessRequestStatus } from '@/hook/useAccessRequestStatus';
import { PageLayout } from '@/layouts';
import { requestDocumentAccess } from '@/services';
import { NextPageWithLayout } from '@/types/next';

const StyledButton = styled(Button)`
  width: auto;

  &[disabled] {
    background-color: #ddd;
  }
`;

const ButtonRow = styled(Box)`
  display: flex;
  flex-direction: row;
  gap: 0.8rem;
  justify-content: center;
  align-items: center;
`;

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const documentId = searchParams.get('doc');
  const { data: hasRequested } = useAccessRequestStatus(documentId);
  const queryClient = useQueryClient();
  const { replace } = useRouter();

  const handleRequestAccess = () => {
    if (!documentId) {
      void replace('/404');
      console.error('No document ID found in URL');
      return;
    }

    void (async () => {
      try {
        await requestDocumentAccess(documentId);
        console.log(`Access request sent for document #${documentId}`);
        void queryClient.invalidateQueries({
          queryKey: ['access-request-status', documentId],
        });
      } catch (err) {
        console.error(err);
        console.error('Failed to send access request');
      }
    })();
  };

  return (
    <>
      <Head>
        <title>
          {t('Access Denied - Error 403')} - {t('Docs')}
        </title>
        <meta
          property="og:title"
          content={`${t('Access Denied - Error 403')} - ${t('Docs')}`}
          key="title"
        />
      </Head>
      <Box
        $align="center"
        $margin="auto"
        $gap="1rem"
        $padding={{ bottom: '2rem' }}
      >
        <Image
          className="c__image-system-filter"
          src={img403}
          alt={t('Image 403')}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />

        <Box $align="center" $gap="0.8rem">
          <Text as="p" $textAlign="center" $maxWidth="350px" $theme="primary">
            {t('You do not have permission to view this document.')}
          </Text>
          <ButtonRow>
            <StyledLink href="/">
              <StyledButton icon={<Icon iconName="house" $color="white" />}>
                {t('Home')}
              </StyledButton>
            </StyledLink>
            
            {hasRequested ? (
              <StyledButton disabled>
                {t('Access request sent')}
              </StyledButton>
            ) : (
              <StyledButton
                icon={<Icon iconName="" $color="white" />}
                onClick={handleRequestAccess}
              >
                {t('Request document access')}
              </StyledButton>
            )}
          </ButtonRow>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PageLayout withFooter={false}>{page}</PageLayout>;
};

export default Page;
