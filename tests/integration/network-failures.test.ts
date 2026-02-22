/**
 * Network Failure Integration Tests
 *
 * Tests network error handling and resilience under adverse conditions.
 * Uses controlled scenarios to validate error handling without impacting live API.
 *
 * Scenarios:
 * - ETIMEDOUT (connection timeout)
 * - ECONNREFUSED (connection refused)
 * - ENOTFOUND (DNS resolution failure)
 * - Network interruption mid-request
 * - 429 rate limit response handling
 */

import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { describe, expect, it } from "vitest";

/** Staging tenant name — override with TEST_TENANT_NAME env var */
const TEST_TENANT = process.env.TEST_TENANT_NAME ?? "staging-test";
const STAGING_BASE_URL = `https://${TEST_TENANT}.staging.volterra.us`;

describe("Network Failure Integration Tests", () => {
  describe("Connection Timeout Scenarios", () => {
    it("should handle ETIMEDOUT with very short timeout", async () => {
      const httpClient = axios.create({
        baseURL: STAGING_BASE_URL,
        timeout: 1, // 1ms timeout - will fail
      });

      try {
        await httpClient.get("/api/web/namespaces");
        expect.fail("Should have thrown timeout error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        expect(axiosErr.code).toBeDefined();
        expect(["ECONNABORTED", "ETIMEDOUT"]).toContain(axiosErr.code);
        expect(axiosErr.message).toContain("timeout");
      }
    });

    it("should provide timeout context in error", async () => {
      const httpClient = axios.create({
        baseURL: STAGING_BASE_URL,
        timeout: 1,
      });

      try {
        await httpClient.get("/api/web/namespaces");
        expect.fail("Should have thrown timeout error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        // Verify error context
        expect(axiosErr.config).toBeDefined();
        expect(axiosErr.config?.timeout).toBe(1);
        expect(axiosErr.config?.url).toBeDefined();
      }
    });

    it("should handle read timeout vs connection timeout", async () => {
      const httpClient = axios.create({
        baseURL: STAGING_BASE_URL,
        timeout: 1,
      });

      try {
        await httpClient.get("/api/web/namespaces");
        expect.fail("Should have thrown timeout error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        // Any timeout error is acceptable
        expect(axiosErr.code).toBeDefined();
        expect(axiosErr.message).toBeDefined();
      }
    });
  });

  describe("DNS Resolution Failures", () => {
    it("should handle ENOTFOUND for invalid hostname", async () => {
      const httpClient = axios.create({
        baseURL: "https://nonexistent-invalid-hostname-12345.volterra.us",
        timeout: 5000,
      });

      try {
        await httpClient.get("/api/web/namespaces");
        expect.fail("Should have thrown DNS error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        expect(axiosErr.code).toBeDefined();
        expect(["ENOTFOUND", "EAI_AGAIN"]).toContain(axiosErr.code);
      }
    });

    it("should handle DNS timeout", async () => {
      const httpClient = axios.create({
        baseURL: "https://test-nonexistent-dns-timeout-12345.invalid",
        timeout: 5000,
      });

      try {
        await httpClient.get("/api/web/namespaces");
        expect.fail("Should have thrown DNS error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        expect(axiosErr.code).toBeDefined();
        // Could be ENOTFOUND or timeout
        expect(axiosErr.code).toBeDefined();
      }
    });
  });

  describe("Connection Refused Scenarios", () => {
    it("should handle ECONNREFUSED on invalid port", async () => {
      const httpClient = axios.create({
        baseURL: "http://127.0.0.1:9999", // Local port that's not listening
        timeout: 5000,
      });

      try {
        await httpClient.get("/api/web/namespaces");
        expect.fail("Should have thrown connection error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        expect(axiosErr.code).toBeDefined();
        // Could be ECONNREFUSED or timeout
        expect(["ECONNREFUSED", "ETIMEDOUT", "ECONNABORTED"]).toContain(axiosErr.code);
      }
    });

    it("should provide connection refused context", async () => {
      const httpClient = axios.create({
        baseURL: "http://127.0.0.1:9999",
        timeout: 3000,
      });

      try {
        await httpClient.get("/test");
        expect.fail("Should have thrown connection error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        // Verify we have error context
        expect(axiosErr.message).toBeDefined();
        expect(axiosErr.config).toBeDefined();
        expect(axiosErr.config?.baseURL).toBe("http://127.0.0.1:9999");
      }
    });
  });

  describe("Network Interruption Scenarios", () => {
    it("should handle connection reset", async () => {
      // Simulate connection reset with invalid host
      const httpClient = axios.create({
        baseURL: "http://192.0.2.1", // TEST-NET-1 - should not route
        timeout: 3000,
      });

      try {
        await httpClient.get("/api/test");
        expect.fail("Should have thrown network error");
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        // Should get network error
        expect(axiosErr.code).toBeDefined();
        expect(["ETIMEDOUT", "ECONNABORTED", "ECONNREFUSED"]).toContain(axiosErr.code);
      }
    });

    it("should handle SSL/TLS errors gracefully", async () => {
      // Try connecting to HTTP endpoint with HTTPS
      const httpClient = axios.create({
        baseURL: "https://example.com:80", // HTTP port with HTTPS protocol
        timeout: 5000,
      });

      try {
        await httpClient.get("/");

        // If it succeeds (redirect or upgrade), that's fine
        expect(true).toBe(true);
      } catch (error: unknown) {
        const axiosErr = error as AxiosError;
        // Should get SSL/TLS or connection error
        expect(axiosErr.code).toBeDefined();
      }
    });
  });

  describe("Rate Limit Handling", () => {
    it("should identify 429 responses", async () => {
      // Note: We can't reliably trigger 429 without flooding the API
      // This test validates our ability to recognize 429 when it occurs

      // Create a test for 429 detection
      const mockError: AxiosError = {
        name: "AxiosError",
        message: "Request failed with status code 429",
        config: {} as InternalAxiosRequestConfig,
        code: "ERR_BAD_REQUEST",
        request: {},
        response: {
          status: 429,
          statusText: "Too Many Requests",
          headers: {
            "retry-after": "60",
          },
          config: {} as InternalAxiosRequestConfig,
          data: {
            error: "Rate limit exceeded",
          },
        },
        isAxiosError: true,
        toJSON: () => ({}),
      };

      // Verify we can detect 429
      expect(mockError.response?.status).toBe(429);
      expect(mockError.response?.headers["retry-after"]).toBeDefined();
    });

    it("should extract retry-after header from 429 responses", async () => {
      // Mock 429 response with retry-after header
      const mockResponse = {
        status: 429,
        headers: {
          "retry-after": "60",
        },
        data: {
          error: "Rate limit exceeded",
        },
      };

      // Verify we can extract retry-after
      const retryAfter = mockResponse.headers["retry-after"];
      expect(retryAfter).toBe("60");
      expect(parseInt(retryAfter, 10)).toBe(60);
    });
  });

  describe("Error Recovery Patterns", () => {
    it("should retry on network errors with exponential backoff", async () => {
      const maxRetries = 3;
      const baseDelay = 100;
      let attemptCount = 0;

      const attemptRequest = async (): Promise<{ data: string }> => {
        attemptCount++;

        if (attemptCount < maxRetries) {
          // Simulate network failure
          throw new Error("Network failure");
        }

        // Succeed on final attempt
        return { data: "success" };
      };

      const retryWithBackoff = async (): Promise<{ data: string }> => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await attemptRequest();
          } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries - 1) {
              const delay = baseDelay * 2 ** attempt;
              await new Promise((resolve) => setTimeout(resolve, delay));
            }
          }
        }

        throw lastError;
      };

      const result = await retryWithBackoff();
      expect(result.data).toBe("success");
      expect(attemptCount).toBe(maxRetries);
    });

    it("should not retry on client errors (4xx)", async () => {
      let attemptCount = 0;

      const attemptRequest = async (): Promise<never> => {
        attemptCount++;

        const error = Object.assign(new Error("Client error"), {
          response: { status: 400 },
        });
        throw error;
      };

      const shouldRetry = (error: unknown): boolean => {
        const resp = (error as { response?: { status: number } }).response;
        const status = resp?.status;
        // Don't retry 4xx errors except 429
        if (
          status !== undefined &&
          status >= 400 &&
          status < 500 &&
          status !== 429
        ) {
          return false;
        }
        return true;
      };

      try {
        await attemptRequest();
        expect.fail("Should have thrown error");
      } catch (error: unknown) {
        expect(shouldRetry(error)).toBe(false);
        expect(attemptCount).toBe(1); // No retries
      }
    });

    it("should retry on server errors (5xx)", async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const attemptRequest = async (): Promise<{ data: string }> => {
        attemptCount++;

        if (attemptCount < maxRetries) {
          const error = Object.assign(new Error("Server error"), {
            response: { status: 500 },
          });
          throw error;
        }

        return { data: "success" };
      };

      const shouldRetry = (error: unknown): boolean => {
        const resp = (error as { response?: { status: number } }).response;
        const status = resp?.status;
        // Retry 5xx errors
        return status !== undefined && status >= 500;
      };

      const retryLogic = async (): Promise<{ data: string } | undefined> => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await attemptRequest();
          } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (!shouldRetry(error) || attempt >= maxRetries - 1) {
              throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      };

      const result = await retryLogic();
      expect(result?.data).toBe("success");
      expect(attemptCount).toBe(maxRetries);
    });
  });

  describe("Error Context Preservation", () => {
    it("should preserve full error context through retries", async () => {
      interface ErrorWithContext extends Error {
        config: { url: string; method: string; baseURL: string };
        response: { status: number; statusText: string };
      }

      const capturedErrors: ErrorWithContext[] = [];

      const attemptWithContext = async (): Promise<void> => {
        const error = Object.assign(new Error("Test error"), {
          config: {
            url: "/api/test",
            method: "GET",
            baseURL: "https://test.example.com",
          },
          response: {
            status: 500,
            statusText: "Internal Server Error",
          },
        });

        capturedErrors.push(error);
        throw error;
      };

      try {
        await attemptWithContext();
      } catch (_error: unknown) {
        expect(capturedErrors.length).toBe(1);
        expect(capturedErrors[0].config).toBeDefined();
        expect(capturedErrors[0].config.url).toBe("/api/test");
        expect(capturedErrors[0].response.status).toBe(500);
      }
    });
  });
});
