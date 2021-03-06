import { styled } from "linaria/react";
import React from "react";

import PageTitle from "@app/components/PageTitle";
import { PageProps } from "@app/components/Router";
import { appVerticalPadding, appHorizontalPadding } from "@app/layout";
import Gap from "@architus/facade/components/Gap";
import Skeleton from "@architus/facade/components/Skeleton";

const Styled = {
  Wrapper: styled.div`
    padding-left: ${appHorizontalPadding};
    padding-top: ${appVerticalPadding};
    padding-bottom: ${appVerticalPadding};
  `,
};

type AppSkeletonProps = PageProps;

/**
 * Default placeholder skeleton shown during app loading states
 * (ideally, each tab would have a better/more specific skeleton)
 */
const AppSkeleton: React.FC<AppSkeletonProps> = () => (
  <>
    <PageTitle title="Dashboard" />
    <Styled.Wrapper>
      <Skeleton.Box width={170} height={40} />
      <Gap amount="nano" />
      <Skeleton.Box width={300} height={20} />
    </Styled.Wrapper>
  </>
);

export default AppSkeleton;
