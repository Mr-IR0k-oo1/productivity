import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Orbit | Launch your work",
  description: "A space-themed launchpad for ideas, tasks, and flowcharts.",
};

export default function HomePage() {
  return <LandingPage />;
}