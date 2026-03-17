import * as fs from 'fs';
import * as path from 'path';
import {
  Camt053ParserService,
  ParsedBankStatement,
} from '../camt053-parser.service';

describe('Camt053ParserService', () => {
  let service: Camt053ParserService;
  let sampleXml: string;

  beforeAll(() => {
    service = new Camt053ParserService();
    sampleXml = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'camt053-sample.xml'),
      'utf-8',
    );
  });

  // ================================================================
  // Valid CAMT.053 parsing
  // ================================================================

  describe('parse() — valid XML', () => {
    let result: ParsedBankStatement;

    beforeAll(() => {
      result = service.parse(sampleXml);
    });

    it('extracts message header', () => {
      expect(result.messageId).toBe('MSG-2024-001');
      expect(result.creationDateTime).toBe('2024-01-31T10:30:00');
    });

    it('extracts exactly one statement', () => {
      expect(result.statements).toHaveLength(1);
    });

    it('extracts statement metadata', () => {
      const stmt = result.statements[0];
      expect(stmt.id).toBe('STMT-2024-001');
      expect(stmt.electronicSequenceNumber).toBe('42');
      expect(stmt.creationDateTime).toBe('2024-01-31T10:30:00');
      expect(stmt.fromDate).toBe('2024-01-01T00:00:00');
      expect(stmt.toDate).toBe('2024-01-31T23:59:59');
    });

    it('extracts account info', () => {
      const stmt = result.statements[0];
      expect(stmt.accountIban).toBe('FR7630006000011234567890189');
      expect(stmt.currency).toBe('EUR');
    });

    it('extracts opening and closing balances', () => {
      const stmt = result.statements[0];
      expect(stmt.openingBalance).toBe(10000);
      expect(stmt.closingBalance).toBe(10150);
    });

    it('extracts exactly 2 transactions', () => {
      const stmt = result.statements[0];
      expect(stmt.transactions).toHaveLength(2);
    });

    it('parses credit transaction (CRDT)', () => {
      const tx = result.statements[0].transactions[0];
      expect(tx.id).toBe('REF-CRDT-001');
      expect(tx.amount).toBe(250);
      expect(tx.currency).toBe('EUR');
      expect(tx.creditDebitIndicator).toBe('CRDT');
      expect(tx.status).toBe('BOOK');
      expect(tx.bookingDate).toBe('2024-01-10');
      expect(tx.valueDate).toBe('2024-01-10');
      expect(tx.reference).toBe('REF-CRDT-001');
      expect(tx.endToEndId).toBe('E2E-INV-2024-001');
      expect(tx.debtorName).toBe('Acme Corporation');
      expect(tx.debtorIban).toBe('DE89370400440532013000');
      expect(tx.remittanceInfo).toBe('Payment for invoice INV-2024-001');
    });

    it('parses debit transaction (DBIT)', () => {
      const tx = result.statements[0].transactions[1];
      expect(tx.id).toBe('REF-DBIT-002');
      expect(tx.amount).toBe(100);
      expect(tx.currency).toBe('EUR');
      expect(tx.creditDebitIndicator).toBe('DBIT');
      expect(tx.status).toBe('BOOK');
      expect(tx.bookingDate).toBe('2024-01-15');
      expect(tx.valueDate).toBe('2024-01-15');
      expect(tx.endToEndId).toBe('E2E-PAY-2024-002');
      expect(tx.debtorName).toBe('Service Provider Ltd');
      expect(tx.debtorIban).toBe('GB29NWBK60161331926819');
      expect(tx.remittanceInfo).toBe('Monthly service fee January');
    });
  });

  // ================================================================
  // Malformed / invalid XML
  // ================================================================

  describe('parse() — error handling', () => {
    it('throws on empty string', () => {
      expect(() => service.parse('')).toThrow('CAMT.053 parse error');
    });

    it('throws on non-string input', () => {
      expect(() => service.parse(null as any)).toThrow(
        'CAMT.053 parse error: xmlContent must be a non-empty string',
      );
    });

    it('throws on XML missing Document root', () => {
      const xml = '<?xml version="1.0"?><Root><Data>test</Data></Root>';
      expect(() => service.parse(xml)).toThrow(
        'missing Document > BkToCstmrStmt root structure',
      );
    });

    it('throws on XML missing GrpHdr/MsgId', () => {
      const xml = `<?xml version="1.0"?>
        <Document><BkToCstmrStmt>
          <GrpHdr><CreDtTm>2024-01-01</CreDtTm></GrpHdr>
          <Stmt><Id>1</Id></Stmt>
        </BkToCstmrStmt></Document>`;
      expect(() => service.parse(xml)).toThrow('missing GrpHdr > MsgId');
    });

    it('throws descriptive error on completely malformed XML', () => {
      const badXml = '<<<NOT XML AT ALL>>>';
      expect(() => service.parse(badXml)).toThrow('CAMT.053 parse error');
    });
  });

  // ================================================================
  // Edge cases
  // ================================================================

  describe('parse() — edge cases', () => {
    it('handles statement with no transactions', () => {
      const xml = `<?xml version="1.0"?>
        <Document><BkToCstmrStmt>
          <GrpHdr><MsgId>EMPTY</MsgId><CreDtTm>2024-01-01</CreDtTm></GrpHdr>
          <Stmt>
            <Id>S1</Id>
            <CreDtTm>2024-01-01</CreDtTm>
            <FrToDt><FrDtTm>2024-01-01</FrDtTm><ToDtTm>2024-01-31</ToDtTm></FrToDt>
            <Acct><Id><IBAN>FR76000</IBAN></Id><Ccy>EUR</Ccy></Acct>
          </Stmt>
        </BkToCstmrStmt></Document>`;
      const result = service.parse(xml);
      expect(result.statements[0].transactions).toHaveLength(0);
      expect(result.statements[0].openingBalance).toBe(0);
      expect(result.statements[0].closingBalance).toBe(0);
    });

    it('handles transaction without NtryDtls (no debtor info)', () => {
      const xml = `<?xml version="1.0"?>
        <Document><BkToCstmrStmt>
          <GrpHdr><MsgId>MINIMAL</MsgId><CreDtTm>2024-01-01</CreDtTm></GrpHdr>
          <Stmt>
            <Id>S1</Id>
            <CreDtTm>2024-01-01</CreDtTm>
            <FrToDt><FrDtTm>2024-01-01</FrDtTm><ToDtTm>2024-01-31</ToDtTm></FrToDt>
            <Acct><Id><IBAN>FR76000</IBAN></Id><Ccy>EUR</Ccy></Acct>
            <Ntry>
              <Amt Ccy="USD">99.99</Amt>
              <CdtDbtInd>CRDT</CdtDbtInd>
              <Sts><Cd>PDNG</Cd></Sts>
              <BookgDt><Dt>2024-01-20</Dt></BookgDt>
              <ValDt><Dt>2024-01-21</Dt></ValDt>
            </Ntry>
          </Stmt>
        </BkToCstmrStmt></Document>`;
      const result = service.parse(xml);
      const tx = result.statements[0].transactions[0];
      expect(tx.amount).toBe(99.99);
      expect(tx.currency).toBe('USD');
      expect(tx.status).toBe('PDNG');
      expect(tx.id).toBe('ENTRY-0'); // fallback ID
      expect(tx.endToEndId).toBeUndefined();
      expect(tx.debtorName).toBeUndefined();
      expect(tx.debtorIban).toBeUndefined();
      expect(tx.remittanceInfo).toBeUndefined();
    });

    it('handles debit opening balance (negative)', () => {
      const xml = `<?xml version="1.0"?>
        <Document><BkToCstmrStmt>
          <GrpHdr><MsgId>DBIT-BAL</MsgId><CreDtTm>2024-01-01</CreDtTm></GrpHdr>
          <Stmt>
            <Id>S1</Id>
            <CreDtTm>2024-01-01</CreDtTm>
            <FrToDt><FrDtTm>2024-01-01</FrDtTm><ToDtTm>2024-01-31</ToDtTm></FrToDt>
            <Acct><Id><IBAN>FR76000</IBAN></Id><Ccy>EUR</Ccy></Acct>
            <Bal>
              <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
              <Amt Ccy="EUR">500.00</Amt>
              <CdtDbtInd>DBIT</CdtDbtInd>
              <Dt><Dt>2024-01-01</Dt></Dt>
            </Bal>
          </Stmt>
        </BkToCstmrStmt></Document>`;
      const result = service.parse(xml);
      expect(result.statements[0].openingBalance).toBe(-500);
    });
  });
});
