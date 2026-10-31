import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "ORBIT — Your life, in orbit. Complete productivity OS.",
  description:
    "Stop managing scattered tools. Bring your tasks, projects, schedule, notes, and goals together in one workspace designed to help you move forward.",
};

export default function HomePage() {
  return <LandingPage />;
}
