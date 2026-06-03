import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
