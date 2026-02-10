import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { GoCardlessMandateEntity } from '../../../../../domain/payments/entities';

/**
 * RUM Generator Service
 * Implements Annexe L: Politique de génération des RUM (Référence Unique de Mandat)
 * 
 * Format: {ICS}-{ContractID}-{YYYY}
 * Example: FT123456789-CTR-2025-00045-2025
 * 
 * Rules:
 * - RUM is unique per ICS (SEPA creditor identifier)
 * - Max length: 35 characters (SEPA limit)
 * - Immutable during mandate lifetime
 * - Allowed characters: alphanumeric + hyphen
 */
@Injectable()
export class RumGeneratorService {
  private readonly MAX_RUM_LENGTH = 35;
  private readonly ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9\-]+$/;

  constructor(
    @InjectRepository(GoCardlessMandateEntity)
    private mandateRepository: Repository<GoCardlessMandateEntity>,
  ) {}

  /**
   * Generate RUM following Annexe L format: {ICS}-{ContractID}-{YYYY}
   * 
   * @param ics - SEPA Creditor Identifier (Identifiant Créancier SEPA)
   * @param contractId - Contract reference (will be truncated/padded to fit)
   * @param year - Year (defaults to current year)
   * @returns Generated RUM string
   * @throws Error if RUM exceeds max length after formatting
   */
  generateRum(ics: string, contractId: string, year?: number): string {
    const currentYear = year || new Date().getFullYear();
    const yearStr = currentYear.toString();

    // Calculate available space for contractId
    // Format: {ICS}-{ContractID}-{YYYY}
    // Hyphens: 2 characters
    const availableSpace = this.MAX_RUM_LENGTH - ics.length - yearStr.length - 2;

    if (availableSpace < 1) {
      throw new Error(
        `ICS (${ics.length}) + Year (${yearStr.length}) + separators exceed RUM max length (${this.MAX_RUM_LENGTH})`,
      );
    }

    // Truncate or pad contractId to fit available space
    const truncatedContractId = contractId.substring(0, availableSpace);

    // Build RUM
    const rum = `${ics}-${truncatedContractId}-${yearStr}`;

    // Validate final RUM
    if (!this.validateRum(rum)) {
      throw new Error(`Generated RUM is invalid: ${rum}`);
    }

    return rum;
  }

  /**
   * Validate RUM format and constraints
   * 
   * @param rum - RUM to validate
   * @returns true if valid, false otherwise
   */
  validateRum(rum: string): boolean {
    // Check length
    if (rum.length > this.MAX_RUM_LENGTH) {
      return false;
    }

    // Check allowed characters (alphanumeric + hyphen)
    if (!this.ALLOWED_CHARS_REGEX.test(rum)) {
      return false;
    }

    // Check format: must have at least 2 hyphens (ICS-ContractID-YYYY)
    const parts = rum.split('-');
    if (parts.length < 3) {
      return false;
    }

    // Check that last part is a valid year (4 digits)
    const lastPart = parts[parts.length - 1];
    if (!/^\d{4}$/.test(lastPart)) {
      return false;
    }

    return true;
  }

  /**
   * Generate SHA-256 hash of RUM for integrity verification
   * 
   * @param rum - RUM to hash
   * @returns SHA-256 hash in hex format
   */
  hashRum(rum: string): string {
    return crypto.createHash('sha256').update(rum).digest('hex');
  }

  /**
   * Check if RUM is unique for a given company
   * 
   * @param companyId - Company/Societe ID
   * @param rum - RUM to check
   * @returns true if unique, false if already exists
   */
  async isUnique(companyId: string, rum: string): Promise<boolean> {
    const existing = await this.mandateRepository.findOne({
      where: {
        societeId: companyId,
        rum: rum,
      },
    });

    return !existing;
  }

  /**
   * Generate and store RUM with uniqueness check
   * If collision occurs, appends sequence number
   * 
   * @param companyId - Company/Societe ID
   * @param ics - SEPA Creditor Identifier
   * @param contractId - Contract reference
   * @returns Generated and validated RUM
   * @throws Error if unable to generate unique RUM after retries
   */
  async generateAndStore(
    companyId: string,
    ics: string,
    contractId: string,
  ): Promise<string> {
    let rum = this.generateRum(ics, contractId);
    let isUnique = await this.isUnique(companyId, rum);
    let attempt = 1;
    const maxAttempts = 10;

    // If collision, append sequence number
    while (!isUnique && attempt < maxAttempts) {
      const sequenceStr = attempt.toString();
      const availableSpace =
        this.MAX_RUM_LENGTH - ics.length - sequenceStr.length - 2;

      if (availableSpace < 1) {
        throw new Error(
          `Cannot generate unique RUM: insufficient space for sequence number`,
        );
      }

      const truncatedContractId = contractId.substring(0, availableSpace);
      rum = `${ics}-${truncatedContractId}-${sequenceStr}`;

      if (!this.validateRum(rum)) {
        throw new Error(`Generated RUM with sequence is invalid: ${rum}`);
      }

      isUnique = await this.isUnique(companyId, rum);
      attempt++;
    }

    if (!isUnique) {
      throw new Error(
        `Failed to generate unique RUM after ${maxAttempts} attempts`,
      );
    }

    return rum;
  }
}
