"use client";

import { Navbar } from "@/components/landing/sections/Navbar";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { ProductIntroSection } from "@/components/landing/sections/ProductIntroSection";
import { WorkspaceSection } from "@/components/landing/sections/WorkspaceSection";
import { FocusSection } from "@/components/landing/sections/FocusSection";
import { PlanningSection } from "@/components/landing/sections/PlanningSection";
import { AnalyticsSection } from "@/components/landing/sections/AnalyticsSection";
import { IntegrationsSection } from "@/components/landing/sections/IntegrationsSection";
import { PricingSection } from "@/components/landing/sections/PricingSection";
import { FinalCtaAndFooter } from "@/components/landing/sections/FinalCtaAndFooter";

/**
 * ORBIT — Landing Page
 * Full 10-section architecture adhering strictly to the "ORBIT — Landing Page Design Plan".
 * 
 * 01 — Navigation (Navbar)
 * 02 — Hero Section (HeroSection)
 * 03 — Product Introduction (ProductIntroSection)
 * 04 — Unified Workspace (WorkspaceSection)
 * 05 — Focus Mode (FocusSection)
 * 06 — Intelligent Planning (PlanningSection)
 * 07 — Progress and Analytics (AnalyticsSection)
 * 08 — Integrations (IntegrationsSection)
 * 09 — Pricing (PricingSection)
 * 10 — Final CTA and Footer (FinalCtaAndFooter)
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#ffffff] selection:bg-[#8b5cf6] selection:text-white">
      {/* 01 — Navigation */}
      <Navbar />

      <main>
        {/* 02 — Hero Section */}
        <HeroSection />

        {/* 03 — Product Introduction (Everything connected. Nothing scattered.) */}
        <ProductIntroSection />

        {/* 04 — Unified Workspace */}
        <WorkspaceSection />

        {/* 05 — Focus Mode */}
        <FocusSection />

        {/* 06 — Intelligent Planning */}
        <PlanningSection />

        {/* 07 — Progress and Analytics */}
        <AnalyticsSection />

        {/* 08 — Integrations */}
        <IntegrationsSection />

        {/* 09 — Pricing */}
        <PricingSection />
      </main>

      {/* 10 — Final CTA and Footer */}
      <FinalCtaAndFooter />
    </div>
  );
}
