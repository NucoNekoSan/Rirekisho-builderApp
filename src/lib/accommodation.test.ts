import { describe, expect, it } from 'vitest';
import { getAccommodationPrintFields, hasSensitiveAccommodationOutput } from './accommodation';
import { createDefaultAccommodation } from './defaults';

describe('accommodation output controls', () => {
  it('does not print sensitive fields unless their toggle is enabled', () => {
    const data = createDefaultAccommodation();
    data.disabilityName = '出力しない診断名';
    data.certificate = '出力しない手帳情報';
    data.requestedAccommodations = '静かな場所で面談したい';

    const fields = getAccommodationPrintFields(data);

    expect(fields.map((field) => field.value)).toEqual(['静かな場所で面談したい']);
    expect(hasSensitiveAccommodationOutput(data)).toBe(false);
  });

  it('prints sensitive fields when explicitly enabled', () => {
    const data = createDefaultAccommodation();
    data.includeDisabilityName = true;
    data.disabilityName = '本人が開示する障害名';

    const fields = getAccommodationPrintFields(data);

    expect(fields).toContainEqual({
      fieldKey: 'disabilityName',
      label: '障害名・診断名',
      value: '本人が開示する障害名',
      sensitive: true,
    });
    expect(hasSensitiveAccommodationOutput(data)).toBe(true);
  });
});
