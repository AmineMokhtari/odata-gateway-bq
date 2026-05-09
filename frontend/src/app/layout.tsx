/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Metadata } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OData Gateway for BigQuery | Governed Data Marketplace",
  description: "Unlock your BigQuery lakehouse for Excel and Power BI with zero drivers and proactive cost control.",
};

import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/Navigation";
import { ElenaDrawer } from "@/components/drawers/ElenaDrawer";
import { MSWProvider } from "./MSWProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MSWProvider>
          <Navigation userName={process.env.DEFAULT_ANONYMOUS_USER_NAME} />
          {children}
          <ElenaDrawer />
          <Toaster position="top-right" closeButton richColors />
        </MSWProvider>
      </body>
    </html>
  );
}
