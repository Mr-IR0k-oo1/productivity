import { describe, expect, it } from "vitest";
import { isAppHost, isMarketingHost, getAppUrl, getMarketingUrl } from "@/lib/config/domains";

describe("Domain & Subdomain Host Classification", () => {
  it("identifies application subdomains accurately", () => {
    expect(isAppHost("app.orbit.io")).toBe(true);
    expect(isAppHost("app.orbit.io:443")).toBe(true);
    expect(isAppHost("app.localhost:3000")).toBe(true);
    expect(isAppHost("app.staging.orbit.internal")).toBe(true);
    expect(isAppHost("tauri.localhost")).toBe(true); // Desktop app environment
  });

  it("identifies marketing domain hosts accurately", () => {
    expect(isMarketingHost("orbit.io")).toBe(true);
    expect(isMarketingHost("www.orbit.io")).toBe(true);
    expect(isMarketingHost("localhost:3000")).toBe(true);
    expect(isMarketingHost("orbit.com")).toBe(true);
  });

  it("differentiates app host from marketing host", () => {
    expect(isMarketingHost("app.orbit.io")).toBe(false);
    expect(isAppHost("orbit.io")).toBe(false);
  });
});

describe("URL Resolution Across Subdomains", () => {
  it("normalizes paths properly", () => {
    const url = getAppUrl("login");
    expect(url.endsWith("/login")).toBe(true);

    const rootUrl = getAppUrl("/");
    expect(rootUrl.endsWith("/")).toBe(true);
  });

  it("formats marketing URLs with correct destination paths", () => {
    const pricing = getMarketingUrl("/pricing");
    expect(pricing.endsWith("/pricing")).toBe(true);

    const features = getMarketingUrl("features");
    expect(features.endsWith("/features")).toBe(true);
  });
});
