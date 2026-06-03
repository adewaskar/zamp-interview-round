"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

/**
 * Collects styled-components' rules during SSR and flushes them into the
 * streamed HTML via `useServerInsertedHTML`, so first paint is styled and there
 * is no hydration flash. On the client it is a pass-through. This is the
 * App-Router equivalent of antd's `AntdRegistry`.
 */
export function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [styledSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledSheet.getStyleElement();
    styledSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
