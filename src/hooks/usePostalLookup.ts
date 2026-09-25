// 郵便番号→住所自動入力フック: 7桁入力で450ms後に自動検索し、住所欄を補完する
import { useEffect, useRef, useState } from 'react';
import { formatPostalCodeInput } from '../lib/inputFormat';
import { lookupPostalAddress, normalizePostalCode, PostalCodeLookupError } from '../lib/postalCode';
import { POSTAL_CODE_DIGITS } from '../lib/config';

type PostalLookupStatus = 'idle' | 'loading' | 'found' | 'candidate' | 'not_found' | 'error';

export interface PostalLookupState {
  status: PostalLookupStatus;
  candidate: string;
  message: string;
  postalCode: string;
}

const POSTAL_LOOKUP_DELAY_MS = 450;

const createPostalLookupState = (): PostalLookupState => ({
  status: 'idle',
  candidate: '',
  message: '',
  postalCode: '',
});

interface UsePostalLookupOptions {
  postalCode: string;
  currentAddress: string;
  setAddress: (address: string) => void;
}

interface UsePostalLookupReturn {
  lookup: PostalLookupState;
  applyCandidate: () => void;
  reset: () => void;
}

export function usePostalLookup({
  postalCode,
  currentAddress,
  setAddress,
}: UsePostalLookupOptions): UsePostalLookupReturn {
  const [lookup, setLookup] = useState<PostalLookupState>(createPostalLookupState);
  const currentAddressRef = useRef(currentAddress);
  const setAddressRef = useRef(setAddress);

  useEffect(() => {
    currentAddressRef.current = currentAddress;
    setAddressRef.current = setAddress;
  });

  useEffect(() => {
    const normalized = normalizePostalCode(postalCode);
    const formatted = formatPostalCodeInput(postalCode);

    if (normalized.length < POSTAL_CODE_DIGITS) {
      setLookup(createPostalLookupState());
      return;
    }

    if (formatted.error) {
      setLookup(createPostalLookupState());
      return;
    }

    if (normalized.length > POSTAL_CODE_DIGITS) {
      setLookup({
        status: 'error',
        candidate: '',
        message: `郵便番号は${POSTAL_CODE_DIGITS}桁で入力してください。`,
        postalCode: normalized,
      });
      return;
    }

    const controller = new AbortController();
    setLookup({
      status: 'loading',
      candidate: '',
      message: '住所を検索しています。',
      postalCode: normalized,
    });

    const timer = window.setTimeout(() => {
      lookupPostalAddress(normalized, controller.signal)
        .then((result) => {
          if (currentAddressRef.current.trim().length === 0) {
            setAddressRef.current(result.address);
            setLookup({
              status: 'found',
              candidate: '',
              message: '住所を自動入力しました。番地・建物名を確認してください。',
              postalCode: result.postalCode,
            });
            return;
          }
          setLookup({
            status: 'candidate',
            candidate: result.address,
            message: `取得住所: ${result.address}`,
            postalCode: result.postalCode,
          });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === 'AbortError') return;
          setLookup({
            status: error instanceof PostalCodeLookupError && error.code === 'not_found' ? 'not_found' : 'error',
            candidate: '',
            message: error instanceof Error ? error.message : '住所を取得できませんでした。手入力してください。',
            postalCode: normalized,
          });
        });
    }, POSTAL_LOOKUP_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [postalCode]);

  const applyCandidate = () => {
    setLookup((current) => {
      if (!current.candidate) return current;
      setAddressRef.current(current.candidate);
      return {
        ...current,
        status: 'found',
        message: '住所を反映しました。番地・建物名を確認してください。',
      };
    });
  };

  const reset = () => setLookup(createPostalLookupState());

  return { lookup, applyCandidate, reset };
}
