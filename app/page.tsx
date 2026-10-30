import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Orbit — issue tracking you host yourself",
  description:
    "Sprints, backlog, board, ideas and flowcharts for startups and growing companies. Self-hosted, with roles and single sign-on.",
};

export default function HomePage() {
  return <LandingPage />;
}
