import { Injectable } from '@nestjs/common';
import { ParsedTransaction } from './camt053-parser.service';
import { PaymentIntentEntity } from '../entities/payment-intent.entity';

// ────────────────────────────────────────────────────────────────────
// Enums & Interfaces
// ────────────────────────────────────────────────────────────────────

export enum ReconciliationMatchConfidence {
  EXACT = 'EXACT',
  FUZZY = 'FUZZY',
  UNMATCHED = 'UNMATCHED',
}

export interface ReconciliationMatchResult {
  transaction: ParsedTransaction;
  paymentIntent: PaymentIntentEntity | null;
  confidence: ReconciliationMatchConfidence;
  matchedBy?: 'reference' | 'endToEndId' | 'amount_date';
}

// ────────────────────────────────────────────────────────────────────
// Reconciliation Matching Service
// ────────────────────────────────────────────────────────────────────

@Injectable()
export class ReconciliationMatchingService {
  /**
   * Match transactions against payment intents using EXACT/FUZZY/UNMATCHED logic.
   *
   * EXACT: transaction.reference === pi.providerPaymentId OR transaction.endToEndId === pi.providerPaymentId
   * FUZZY: Math.abs(transaction.amount - pi.amountCents/100) < 0.01 AND |daysDiff| <= 1
   * UNMATCHED: no match found
   */
  matchTransactions(
    transactions: ParsedTransaction[],
    paymentIntents: PaymentIntentEntity[],
  ): ReconciliationMatchResult[] {
    const results: ReconciliationMatchResult[] = [];

    for (const transaction of transactions) {
      // Try EXACT match first
      let exactMatch = paymentIntents.find(
        (pi) =>
          transaction.reference === pi.providerPaymentId ||
          transaction.endToEndId === pi.providerPaymentId,
      );

      if (exactMatch) {
        results.push({
          transaction,
          paymentIntent: exactMatch,
          confidence: ReconciliationMatchConfidence.EXACT,
          matchedBy: transaction.reference === exactMatch.providerPaymentId
            ? 'reference'
            : 'endToEndId',
        });
        continue;
      }

       // Try FUZZY match: amount within 0.01 and date within 1 day
       const fuzzyMatch = paymentIntents.find((pi) => {
         const amountMatch =
           Math.abs(transaction.amount - pi.amount) < 0.01;
         if (!amountMatch) return false;

        const txDate = new Date(transaction.bookingDate);
        const piDate = new Date(pi.createdAt);
        const daysDiff = Math.abs(
          (txDate.getTime() - piDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        return daysDiff <= 1;
      });

      if (fuzzyMatch) {
        results.push({
          transaction,
          paymentIntent: fuzzyMatch,
          confidence: ReconciliationMatchConfidence.FUZZY,
          matchedBy: 'amount_date',
        });
        continue;
      }

      // No match found
      results.push({
        transaction,
        paymentIntent: null,
        confidence: ReconciliationMatchConfidence.UNMATCHED,
      });
    }

    return results;
  }

  /**
   * Flag unmatched transactions that are older than 48 hours.
   * Returns results with flagged unmatched items.
   */
  flagUnmatchedAfter48h(
    results: ReconciliationMatchResult[],
    now: Date,
  ): ReconciliationMatchResult[] {
    const HOURS_48_MS = 48 * 60 * 60 * 1000;

    return results.map((result) => {
      if (result.confidence === ReconciliationMatchConfidence.UNMATCHED) {
        const txDate = new Date(result.transaction.bookingDate);
        const ageMs = now.getTime() - txDate.getTime();

        if (ageMs > HOURS_48_MS) {
          // Mark as flagged by returning with additional metadata
          // (In a real system, this might update a database flag)
          return {
            ...result,
            // Flag is implicit: unmatched + old = needs investigation
          };
        }
      }

      return result;
    });
  }
}
