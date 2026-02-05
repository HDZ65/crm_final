import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoCardlessMandateEntity } from './entities/gocardless-mandate.entity';
import { randomBytes } from 'crypto';

const RUM_MAX_LENGTH = 35;
const RUM_PREFIX = 'RUM';
const ALPHANUMERIC_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

@Injectable()
export class RumGeneratorService {
  constructor(
    @InjectRepository(GoCardlessMandateEntity)
    private readonly mandateRepository: Repository<GoCardlessMandateEntity>,
  ) {}

  async generate(societeId: string): Promise<string> {
    let rum: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      rum = this.buildRum(societeId);
      attempts++;

      if (attempts >= maxAttempts) {
        throw new Error(`Failed to generate unique RUM after ${maxAttempts} attempts`);
      }
    } while (await this.exists(rum));

    return rum;
  }

  private buildRum(societeId: string): string {
    const timestamp = this.getTimestampPart();
    const societePart = this.sanitize(societeId).slice(0, 8).toUpperCase();
    const randomPart = this.generateRandomPart(8);

    const rum = `${RUM_PREFIX}${societePart}${timestamp}${randomPart}`;

    return rum.slice(0, RUM_MAX_LENGTH);
  }

  private getTimestampPart(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private generateRandomPart(length: number): string {
    const bytes = randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += ALPHANUMERIC_CHARS[bytes[i] % ALPHANUMERIC_CHARS.length];
    }

    return result;
  }

  private sanitize(input: string): string {
    return input.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  private async exists(rum: string): Promise<boolean> {
    const existing = await this.mandateRepository.findOne({
      where: { rum },
    });
    return !!existing;
  }

  validate(rum: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rum) {
      errors.push('RUM is required');
      return { valid: false, errors };
    }

    if (rum.length > RUM_MAX_LENGTH) {
      errors.push(`RUM must not exceed ${RUM_MAX_LENGTH} characters (got ${rum.length})`);
    }

    if (!/^[A-Z0-9]+$/.test(rum)) {
      errors.push('RUM must contain only uppercase alphanumeric characters (A-Z, 0-9)');
    }

    if (!rum.startsWith(RUM_PREFIX)) {
      errors.push(`RUM should start with "${RUM_PREFIX}" prefix`);
    }

    return { valid: errors.length === 0, errors };
  }

  parse(rum: string): { prefix: string; societeId: string; date: string; random: string } | null {
    if (!rum || rum.length < 17) return null;

    return {
      prefix: rum.slice(0, 3),
      societeId: rum.slice(3, 11),
      date: rum.slice(11, 17),
      random: rum.slice(17),
    };
  }
}
