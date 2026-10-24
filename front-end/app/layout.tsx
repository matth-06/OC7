import type { ReactNode } from "react";

export default function LoginLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html>
      <body>
       {children}
      </body>
    </html>
  )
}
