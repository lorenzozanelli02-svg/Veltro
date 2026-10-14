import { afterEach, describe, expect, it, vi } from "vitest";
import { aiMode, paymentsMode } from "@/lib/config";
import { isReportId, newReportId } from "@/lib/ids";
import { sniffImageType } from "@/lib/images";
import { ANALYSIS_LIMITS, checkRateLimit } from "@/lib/ratelimit";

afterEach(() => vi.unstubAllEnvs());

describe("config", () => {
  it("never falls back to mocks in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(aiMode()).toBe("off");
    expect(paymentsMode()).toBe("off");
  });

  it("uses mocks without keys in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(aiMode()).toBe("mock");
  });

  it("goes live when a key is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_123");
    expect(paymentsMode()).toBe("live");
  });
});

describe("report ids", () => {
  it("are 22 URL-safe characters and unique", () => {
    const ids = new Set(Array.from({ length: 1000 }, newReportId));
    expect(ids.size).toBe(1000);
    for (const id of ids) expect(isReportId(id)).toBe(true);
    expect(isReportId("../../etc/passwd")).toBe(false);
  });
});

describe("sniffImageType", () => {
  it("reads the real type from the bytes", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
});

describe("checkRateLimit", () => {
  function counter() {
    const counts = new Map<string, number>();
    return async (key: string) => {
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return { count: counts.get(key)!, resetInSeconds: 60 };
    };
  }

  it("blocks a visitor after the burst limit", async () => {
    const count = counter();
    for (let i = 0; i < ANALYSIS_LIMITS.burst.max; i++) expect((await checkRateLimit("1.2.3.4", ANALYSIS_LIMITS, count)).ok).toBe(true);
    expect(await checkRateLimit("1.2.3.4", ANALYSIS_LIMITS, count)).toMatchObject({ ok: false, scope: "visitor" });
    expect((await checkRateLimit("5.6.7.8", ANALYSIS_LIMITS, count)).ok).toBe(true);
  });

  it("stops everyone once the daily cap is reached", async () => {
    vi.stubEnv("DAILY_ANALYSIS_CAP", "2");
    const count = counter();
    expect((await checkRateLimit("a", ANALYSIS_LIMITS, count)).ok).toBe(true);
    expect((await checkRateLimit("b", ANALYSIS_LIMITS, count)).ok).toBe(true);
    expect(await checkRateLimit("c", ANALYSIS_LIMITS, count)).toMatchObject({ ok: false, scope: "global" });
  });
});
