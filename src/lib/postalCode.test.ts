import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAddressFromZipCloudResult,
  lookupPostalAddress,
  normalizePostalCode,
  PostalCodeLookupError,
} from './postalCode';

const zipCloudSuccess = (address1 = '東京都', address2 = '新宿区', address3 = '新宿') => ({
  status: 200,
  message: null,
  results: [{ address1, address2, address3 }],
});

const stubFetchJson = (data: unknown, ok = true) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    json: async () => data,
  }));
};

describe('postal code lookup', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes Japanese postal code input', () => {
    expect(normalizePostalCode('160-0022')).toBe('1600022');
    expect(normalizePostalCode('１６０ ００２２')).toBe('1600022');
    expect(normalizePostalCode('〒160ー0022')).toBe('1600022');
  });

  it('builds a Japanese address from ZipCloud response records', () => {
    expect(buildAddressFromZipCloudResult({ address1: '東京都', address2: '新宿区', address3: '新宿' })).toBe('東京都新宿区新宿');
  });

  it('looks up an address for a complete postal code', async () => {
    stubFetchJson(zipCloudSuccess());

    await expect(lookupPostalAddress('160-0022')).resolves.toEqual({
      postalCode: '1600022',
      address: '東京都新宿区新宿',
    });

    expect(fetch).toHaveBeenCalledWith('https://zipcloud.ibsnet.co.jp/api/search?zipcode=1600022', { signal: undefined });
  });

  it('rejects incomplete postal code input before fetching', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(lookupPostalAddress('160')).rejects.toMatchObject({ code: 'invalid' });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports not found and response failures', async () => {
    stubFetchJson({ status: 200, message: null, results: null });

    await expect(lookupPostalAddress('0000000')).rejects.toBeInstanceOf(PostalCodeLookupError);
    await expect(lookupPostalAddress('0000000')).rejects.toMatchObject({ code: 'not_found' });

    stubFetchJson({ status: 500, message: 'error', results: null });

    await expect(lookupPostalAddress('1600022')).rejects.toMatchObject({ code: 'response' });
  });
});
