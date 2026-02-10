import { Injectable } from '@nestjs/common';

@Injectable()
export class IbanMaskingService {
  private readonly ibanPattern = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]){10,30}\b/gi;

  mask(iban: string): string {
    const normalizedIban = this.normalize(iban);

    if (normalizedIban.length <= 8) {
      return normalizedIban;
    }

    const visiblePrefix = normalizedIban.slice(0, 4);
    const visibleSuffix = normalizedIban.slice(-4);

    return `${visiblePrefix} **** **** ${visibleSuffix}`;
  }

  maskBic(bic: string): string {
    const normalizedBic = this.normalize(bic);

    if (normalizedBic.length <= 3) {
      return normalizedBic;
    }

    return `${normalizedBic.slice(0, 3)}${'*'.repeat(normalizedBic.length - 3)}`;
  }

  maskInLog(text: string): string {
    if (!text) {
      return text;
    }

    return text.replace(this.ibanPattern, (candidate) => this.mask(candidate));
  }

  private normalize(value: string): string {
    return value.replace(/\s+/g, '').toUpperCase();
  }
}
