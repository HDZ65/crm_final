import { Injectable } from '@nestjs/common';
import { XMLBuilder } from 'fast-xml-parser';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { CompanyInfo } from '../../compliance/constants/legal-requirements.constant';
import dayjs from 'dayjs';

/**
 * Service de génération XML conforme Factur-X / ZUGFeRD
 * Norme: EN 16931 (Cross Industry Invoice - CII)
 * Profil: BASIC / MINIMUM / EN 16931
 */
@Injectable()
export class XmlGeneratorService {
  /**
   * Génère le XML Factur-X complet pour une facture
   */
  generateFacturXXml(invoice: Invoice, companyInfo: CompanyInfo): string {
    const xmlData = this.buildCrossIndustryInvoice(invoice, companyInfo);

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: '  ',
      suppressEmptyNode: true,
    });

    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    return xmlHeader + builder.build(xmlData);
  }

  /**
   * Construction de la structure Cross Industry Invoice (CII)
   * Format XML conforme à la norme UN/CEFACT
   */
  private buildCrossIndustryInvoice(
    invoice: Invoice,
    companyInfo: CompanyInfo,
  ): any {
    return {
      'rsm:CrossIndustryInvoice': {
        '@_xmlns:rsm':
          'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
        '@_xmlns:qdt':
          'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
        '@_xmlns:ram':
          'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
        '@_xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
        '@_xmlns:udt':
          'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',

        // Context
        'rsm:ExchangedDocumentContext': {
          'ram:GuidelineSpecifiedDocumentContextParameter': {
            'ram:ID': 'urn:factur-x.eu:1p0:basic',
          },
        },

        // Document Header
        'rsm:ExchangedDocument': {
          'ram:ID': invoice.invoiceNumber,
          'ram:TypeCode': this.getInvoiceTypeCode(invoice),
          'ram:IssueDateTime': {
            'udt:DateTimeString': {
              '@_format': '102',
              '#text': dayjs(invoice.issueDate).format('YYYYMMDD'),
            },
          },
          'ram:IncludedNote': {
            'ram:Content': invoice.notes || 'Facture',
          },
        },

        // Transaction Data
        'rsm:SupplyChainTradeTransaction': {
          // Items (lignes de facture)
          'ram:IncludedSupplyChainTradeLineItem': invoice.items.map(
            (item, index) => ({
              'ram:AssociatedDocumentLineDocument': {
                'ram:LineID': (index + 1).toString(),
              },
              'ram:SpecifiedTradeProduct': {
                'ram:Name': item.description,
              },
              'ram:SpecifiedLineTradeAgreement': {
                'ram:NetPriceProductTradePrice': {
                  'ram:ChargeAmount': Number(item.unitPriceHT).toFixed(2),
                },
              },
              'ram:SpecifiedLineTradeDelivery': {
                'ram:BilledQuantity': {
                  '@_unitCode': this.getUnitCode(item.unit),
                  '#text': String(item.quantity),
                },
              },
              'ram:SpecifiedLineTradeSettlement': {
                'ram:ApplicableTradeTax': {
                  'ram:TypeCode': 'VAT',
                  'ram:CategoryCode': 'S',
                  'ram:RateApplicablePercent': Number(item.vatRate).toFixed(2),
                },
                'ram:SpecifiedTradeSettlementLineMonetarySummation': {
                  'ram:LineTotalAmount': Number(item.totalHT).toFixed(2),
                },
              },
            }),
          ),

          // Trade Agreement (Seller & Buyer)
          'ram:ApplicableHeaderTradeAgreement': {
            'ram:SellerTradeParty': {
              'ram:Name': companyInfo.name,
              'ram:SpecifiedLegalOrganization': {
                'ram:ID': {
                  '@_schemeID': 'SIRET',
                  '#text': companyInfo.siret,
                },
              },
              'ram:PostalTradeAddress': {
                'ram:LineOne': companyInfo.address,
                'ram:CountryID': 'FR',
              },
              'ram:SpecifiedTaxRegistration': {
                'ram:ID': {
                  '@_schemeID': 'VA',
                  '#text': companyInfo.tvaNumber,
                },
              },
            },
            'ram:BuyerTradeParty': {
              'ram:Name': invoice.customerName,
              'ram:PostalTradeAddress': {
                'ram:LineOne': invoice.customerAddress,
                'ram:CountryID': 'FR',
              },
              ...(invoice.customerTvaNumber && {
                'ram:SpecifiedTaxRegistration': {
                  'ram:ID': {
                    '@_schemeID': 'VA',
                    '#text': invoice.customerTvaNumber,
                  },
                },
              }),
            },
          },

          // Trade Delivery
          'ram:ApplicableHeaderTradeDelivery': {
            'ram:ActualDeliverySupplyChainEvent': {
              'ram:OccurrenceDateTime': {
                'udt:DateTimeString': {
                  '@_format': '102',
                  '#text': dayjs(invoice.deliveryDate).format('YYYYMMDD'),
                },
              },
            },
          },

          // Trade Settlement (Montants et paiement)
          'ram:ApplicableHeaderTradeSettlement': {
            'ram:PaymentReference': invoice.invoiceNumber,
            'ram:InvoiceCurrencyCode': 'EUR',
            'ram:SpecifiedTradeSettlementPaymentMeans': {
              'ram:TypeCode': '30', // 30 = Virement bancaire
              'ram:Information': `Paiement à ${invoice.paymentTermsDays} jours`,
            },
            'ram:ApplicableTradeTax': this.buildTaxBreakdown(invoice),
            'ram:SpecifiedTradePaymentTerms': {
              'ram:Description': `Paiement à ${invoice.paymentTermsDays} jours. Pénalités de retard: ${invoice.latePaymentInterestRate}%. Indemnité de recouvrement: ${invoice.recoveryIndemnity}€.`,
              'ram:DueDateDateTime': {
                'udt:DateTimeString': {
                  '@_format': '102',
                  '#text': dayjs(invoice.dueDate).format('YYYYMMDD'),
                },
              },
            },
            'ram:SpecifiedTradeSettlementHeaderMonetarySummation': {
              'ram:LineTotalAmount': Number(invoice.totalHT).toFixed(2),
              'ram:TaxBasisTotalAmount': Number(invoice.totalHT).toFixed(2),
              'ram:TaxTotalAmount': {
                '@_currencyID': 'EUR',
                '#text': Number(invoice.totalTVA).toFixed(2),
              },
              'ram:GrandTotalAmount': Number(invoice.totalTTC).toFixed(2),
              'ram:DuePayableAmount': Number(invoice.totalTTC).toFixed(2),
            },
          },
        },
      },
    };
  }

  /**
   * Détermine le code de type de facture
   * 380 = Commercial invoice
   * 381 = Credit note (Avoir)
   */
  private getInvoiceTypeCode(invoice: Invoice): string {
    return invoice.status === 'CREDIT_NOTE' ? '381' : '380';
  }

  /**
   * Calcule la répartition de TVA par taux
   */
  private buildTaxBreakdown(invoice: Invoice): any[] {
    const taxMap = new Map<
      number,
      { basisAmount: number; taxAmount: number }
    >();

    invoice.items.forEach((item) => {
      const existing = taxMap.get(item.vatRate) || {
        basisAmount: 0,
        taxAmount: 0,
      };
      existing.basisAmount += Number(item.totalHT);
      existing.taxAmount += Number(item.totalTVA);
      taxMap.set(item.vatRate, existing);
    });

    return Array.from(taxMap.entries()).map(([rate, amounts]) => ({
      'ram:CalculatedAmount': Number(amounts.taxAmount).toFixed(2),
      'ram:TypeCode': 'VAT',
      'ram:BasisAmount': Number(amounts.basisAmount).toFixed(2),
      'ram:CategoryCode': 'S',
      'ram:RateApplicablePercent': Number(rate).toFixed(2),
    }));
  }

  /**
   * Convertit l'unité française en code UN/ECE
   */
  private getUnitCode(unit: string): string {
    const unitMap: Record<string, string> = {
      pièce: 'C62', // Unit
      heure: 'HUR', // Hour
      jour: 'DAY', // Day
      kg: 'KGM', // Kilogram
      litre: 'LTR', // Liter
      mètre: 'MTR', // Meter
      'm²': 'MTK', // Square meter
      'm³': 'MTQ', // Cubic meter
    };

    return unitMap[unit.toLowerCase()] || 'C62'; // Default: pièce
  }
}
