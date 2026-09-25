// 郵便番号→住所変換: zipcloud API を呼び出して住所を取得する（外部通信はこのファイルのみ）
import { extractDigits } from './textNormalize';
import { isRecord } from './validation';
import { POSTAL_CODE_DIGITS } from './config';

interface PostalAddressResult {
  postalCode: string;
  address: string;
}

type PostalCodeLookupErrorCode = 'invalid' | 'not_found' | 'network' | 'response';

export class PostalCodeLookupError extends Error {
  readonly code: PostalCodeLookupErrorCode;

  constructor(message: string, code: PostalCodeLookupErrorCode) {
    super(message);
    this.code = code;
    this.name = 'PostalCodeLookupError';
  }
}

const ZIPCLOUD_API_URL = 'https://zipcloud.ibsnet.co.jp/api/search';
const ADDRESS_PARSE_ERROR = '郵便番号から住所を読み取れませんでした。';
const NETWORK_ERROR = '住所を取得できませんでした。通信状態を確認してください。';
const RESPONSE_ERROR = '住所を取得できませんでした。時間をおいて再度お試しください。';
const NOT_FOUND_ERROR = '該当する住所が見つかりませんでした。';

const asAddressPart = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const normalizePostalCode = (value: string): string => extractDigits(value);

export const buildAddressFromZipCloudResult = (value: unknown): string => {
  if (!isRecord(value)) throw new PostalCodeLookupError(ADDRESS_PARSE_ERROR, 'response');

  const address = [value.address1, value.address2, value.address3].map(asAddressPart).join('');
  if (!address) throw new PostalCodeLookupError(ADDRESS_PARSE_ERROR, 'response');
  return address;
};

export const lookupPostalAddress = async (
  value: string,
  signal?: AbortSignal,
): Promise<PostalAddressResult> => {
  const postalCode = normalizePostalCode(value);
  if (postalCode.length !== POSTAL_CODE_DIGITS) {
    throw new PostalCodeLookupError(`郵便番号は${POSTAL_CODE_DIGITS}桁で入力してください。`, 'invalid');
  }

  let response: Response;
  try {
    response = await fetch(`${ZIPCLOUD_API_URL}?zipcode=${encodeURIComponent(postalCode)}`, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new PostalCodeLookupError(NETWORK_ERROR, 'network');
  }

  if (!response.ok) {
    throw new PostalCodeLookupError(NETWORK_ERROR, 'network');
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new PostalCodeLookupError(RESPONSE_ERROR, 'response');
  }

  if (!isRecord(data) || data.status !== 200) {
    throw new PostalCodeLookupError(RESPONSE_ERROR, 'response');
  }

  if (data.results === null) {
    throw new PostalCodeLookupError(NOT_FOUND_ERROR, 'not_found');
  }

  if (!Array.isArray(data.results) || data.results.length === 0) {
    throw new PostalCodeLookupError(NOT_FOUND_ERROR, 'not_found');
  }

  return {
    postalCode,
    address: buildAddressFromZipCloudResult(data.results[0]),
  };
};
