import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

// ────────────────────────────────────────────────────────────────────
// Parsed output interfaces (CAMT.053 / ISO 20022)
// ────────────────────────────────────────────────────────────────────

export interface ParsedBankStatement {
  messageId: string;
  creationDateTime: string;
  statements: ParsedStatement[];
}

export interface ParsedStatement {
  id: string;
  electronicSequenceNumber?: string;
  creationDateTime: string;
  fromDate: string;
  toDate: string;
  accountIban?: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  transactions: ParsedTransaction[];
}

export interface ParsedTransaction {
  id: string;
  amount: number;
  currency: string;
  creditDebitIndicator: 'CRDT' | 'DBIT';
  status: string;
  bookingDate: string;
  valueDate: string;
  reference?: string;
  endToEndId?: string;
  debtorName?: string;
  debtorIban?: string;
  remittanceInfo?: string;
}

// ────────────────────────────────────────────────────────────────────
// CAMT.053 Parser Service
// ────────────────────────────────────────────────────────────────────

@Injectable()
export class Camt053ParserService {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      removeNSPrefix: true,
      parseTagValue: true,
      trimValues: true,
    });
  }

  /**
   * Parse a CAMT.053 (ISO 20022 BkToCstmrStmt) XML string into structured data.
   * @throws Error if the XML is malformed or missing required CAMT.053 structure.
   */
  parse(xmlContent: string): ParsedBankStatement {
    if (!xmlContent || typeof xmlContent !== 'string') {
      throw new Error('CAMT.053 parse error: xmlContent must be a non-empty string');
    }

    let parsed: Record<string, any>;
    try {
      parsed = this.parser.parse(xmlContent);
    } catch (error) {
      throw new Error(
        `CAMT.053 parse error: malformed XML — ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const doc = parsed?.Document;
    if (!doc?.BkToCstmrStmt) {
      throw new Error(
        'CAMT.053 parse error: missing Document > BkToCstmrStmt root structure',
      );
    }

    const root = doc.BkToCstmrStmt;
    const grpHdr = root.GrpHdr;
    if (!grpHdr?.MsgId) {
      throw new Error('CAMT.053 parse error: missing GrpHdr > MsgId');
    }

    const stmts = this.ensureArray(root.Stmt);

    return {
      messageId: String(grpHdr.MsgId),
      creationDateTime: String(grpHdr.CreDtTm),
      statements: stmts.map((stmt) => this.parseStatement(stmt)),
    };
  }

  // ── Statement ──────────────────────────────────────────────────────

  private parseStatement(stmt: Record<string, any>): ParsedStatement {
    const balances = this.ensureArray(stmt.Bal);
    const entries = this.ensureArray(stmt.Ntry);

    const openingBal = balances.find(
      (b) => b?.Tp?.CdOrPrtry?.Cd === 'OPBD',
    );
    const closingBal = balances.find(
      (b) => b?.Tp?.CdOrPrtry?.Cd === 'CLBD',
    );

    return {
      id: String(stmt.Id),
      electronicSequenceNumber: stmt.ElctrncSeqNb
        ? String(stmt.ElctrncSeqNb)
        : undefined,
      creationDateTime: String(stmt.CreDtTm),
      fromDate: String(stmt.FrToDt?.FrDtTm ?? ''),
      toDate: String(stmt.FrToDt?.ToDtTm ?? ''),
      accountIban: stmt.Acct?.Id?.IBAN
        ? String(stmt.Acct.Id.IBAN)
        : undefined,
      currency: String(
        stmt.Acct?.Ccy ?? openingBal?.Amt?.['@_Ccy'] ?? 'EUR',
      ),
      openingBalance: this.parseBalanceAmount(openingBal),
      closingBalance: this.parseBalanceAmount(closingBal),
      transactions: entries.map((entry, idx) =>
        this.parseTransaction(entry, idx),
      ),
    };
  }

  // ── Balance ────────────────────────────────────────────────────────

  private parseBalanceAmount(bal: Record<string, any> | undefined): number {
    if (!bal) return 0;
    const raw = bal.Amt?.['#text'] ?? bal.Amt;
    const amount = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (isNaN(amount)) return 0;
    // Debit balances are negative
    return bal.CdtDbtInd === 'DBIT' ? -amount : amount;
  }

  // ── Transaction entry ──────────────────────────────────────────────

  private parseTransaction(
    entry: Record<string, any>,
    index: number,
  ): ParsedTransaction {
    const txDtlsList = this.ensureArray(
      entry.NtryDtls?.TxDtls,
    );
    const txDtls = txDtlsList[0]; // first transaction detail block

    const amtRaw = entry.Amt?.['#text'] ?? entry.Amt;
    const amount =
      typeof amtRaw === 'number' ? amtRaw : parseFloat(String(amtRaw));
    const currency = entry.Amt?.['@_Ccy'] ?? 'EUR';

    // Status may be nested <Sts><Cd>BOOK</Cd></Sts> or flat <Sts>BOOK</Sts>
    const status = entry.Sts?.Cd ?? entry.Sts ?? 'UNKN';

    return {
      id: entry.AcctSvcrRef
        ? String(entry.AcctSvcrRef)
        : `ENTRY-${index}`,
      amount: isNaN(amount) ? 0 : amount,
      currency: String(currency),
      creditDebitIndicator: entry.CdtDbtInd === 'DBIT' ? 'DBIT' : 'CRDT',
      status: String(status),
      bookingDate: String(entry.BookgDt?.Dt ?? entry.BookgDt ?? ''),
      valueDate: String(entry.ValDt?.Dt ?? entry.ValDt ?? ''),
      reference: entry.AcctSvcrRef
        ? String(entry.AcctSvcrRef)
        : undefined,
      endToEndId: txDtls?.Refs?.EndToEndId
        ? String(txDtls.Refs.EndToEndId)
        : undefined,
      debtorName: txDtls?.RltdPties?.Dbtr?.Nm
        ? String(txDtls.RltdPties.Dbtr.Nm)
        : undefined,
      debtorIban: txDtls?.RltdPties?.DbtrAcct?.Id?.IBAN
        ? String(txDtls.RltdPties.DbtrAcct.Id.IBAN)
        : undefined,
      remittanceInfo: txDtls?.RmtInf?.Ustrd
        ? String(txDtls.RmtInf.Ustrd)
        : undefined,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private ensureArray<T>(value: T | T[] | undefined | null): T[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }
}
