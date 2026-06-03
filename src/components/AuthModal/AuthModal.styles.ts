import styled from "styled-components";

/** Brand header shown in the modal title (compass mark + app name). */
export const BrandHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const BrandLogo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colorPrimaryHover},
    ${({ theme }) => theme.colorPrimary}
  );
  color: ${({ theme }) => theme.colorTextLightSolid};
  font-size: 16px;
`;

export const BrandName = styled.span`
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: ${({ theme }) => theme.colorText};
`;

/** Spacing between the mode toggle and the active form. */
export const ModeToggleWrap = styled.div`
  margin-bottom: 18px;
`;

export const Subtitle = styled.p`
  margin: 0 0 18px;
  color: ${({ theme }) => theme.colorTextSecondary};
  font-size: 13px;
`;

/** Modal title row: brand on the left, the light/dark toggle on the right. */
export const TitleBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.padding}px;
`;
