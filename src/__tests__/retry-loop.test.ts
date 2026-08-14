import { describe, it, expect, vi } from 'vitest';

// Re-implement the retry logic from useWeatherData for testing
// Using a minimal delay (0ms) for test performance
async function fetchWithRetry(
  url: string,
  retries = 3,
  fetchFn: (url: string) => Promise<Response>
): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetchFn(url);
    if (response.ok) return response;
    if (response.status === 429 && attempt < retries - 1) {
      // In production this is 2000 * Math.pow(2, attempt) — here we skip the delay
      continue;
    }
    throw new Error(
      response.status === 429
        ? 'Weather service is busy. Please wait a moment and try again.'
        : `Weather API error: ${response.status}`
    );
  }
  throw new Error('Failed after retries');
}

// CompareRegions retry loop (slightly different behavior)
async function fetchCompareWithRetry(
  url: string,
  fetchFn: (url: string) => Promise<Response>
): Promise<Response> {
  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetchFn(url);
    if (response.ok) break;
    if (response.status === 429) {
      continue;
    }
    break;
  }
  return response!;
}

describe('fetchWithRetry (for-loop retry)', () => {
  it('returns immediately on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const result = await fetchWithRetry('http://test.com', 3, mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await fetchWithRetry('http://test.com', 3, mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries on 429 and succeeds on third attempt', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await fetchWithRetry('http://test.com', 3, mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting all retries on 429', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });

    await expect(fetchWithRetry('http://test.com', 3, mockFetch))
      .rejects.toThrow('Weather service is busy');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws immediately on non-429 error (no retry)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(fetchWithRetry('http://test.com', 3, mockFetch))
      .rejects.toThrow('Weather API error: 500');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws on 404 without retrying', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(fetchWithRetry('http://test.com', 3, mockFetch))
      .rejects.toThrow('Weather API error: 404');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('respects custom retry count of 5', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });

    await expect(fetchWithRetry('http://test.com', 5, mockFetch))
      .rejects.toThrow('Weather service is busy');
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it('handles retry count of 1 (no retries possible)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });

    await expect(fetchWithRetry('http://test.com', 1, mockFetch))
      .rejects.toThrow('Weather service is busy');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('passes the URL to each fetch call', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    await fetchWithRetry('http://api.example.com/data', 3, mockFetch);
    expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://api.example.com/data');
    expect(mockFetch).toHaveBeenNthCalledWith(2, 'http://api.example.com/data');
  });
});

describe('fetchCompareWithRetry (CompareRegions for-loop retry)', () => {
  it('returns response on immediate success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

    const result = await fetchCompareWithRetry('http://test.com', mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 up to 3 times', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await fetchCompareWithRetry('http://test.com', mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('stops retrying on non-429 error (breaks loop)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await fetchCompareWithRetry('http://test.com', mockFetch);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns last failed 429 response after all retries', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });

    const result = await fetchCompareWithRetry('http://test.com', mockFetch);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(429);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('breaks on success at second attempt', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await fetchCompareWithRetry('http://test.com', mockFetch);
    expect(result.ok).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
