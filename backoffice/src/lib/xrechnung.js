'use strict';
// E-Rechnung im Format XRechnung 3.0 (UBL 2.1 Syntax, EN 16931).
// Seit 01.01.2025 müssen Unternehmen in DE E-Rechnungen empfangen können; die Ausstellungspflicht
// im B2B folgt gestaffelt (2027/2028). Vor Produktivnutzung mit dem KoSIT-Validator prüfen.
const settings = require('./settings');

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const amt = (cents) => (cents / 100).toFixed(2);

const UNIT_CODES = {
  'stk.': 'C62', stk: 'C62', stück: 'C62', pauschal: 'LS', psch: 'LS', 'psch.': 'LS', h: 'HUR', std: 'HUR', 'std.': 'HUR', stunde: 'HUR',
  stunden: 'HUR', tag: 'DAY', tage: 'DAY', monat: 'MON', monate: 'MON', km: 'KMT', kg: 'KGM', m: 'MTR', 'm²': 'MTK', m2: 'MTK', l: 'LTR',
  woche: 'WEE', jahr: 'ANN', min: 'MIN', nacht: 'DAY', schicht: 'C62',
};
const unitCode = (u) => UNIT_CODES[String(u || '').trim().toLowerCase()] || 'C62';

function taxCategory(rate, d) {
  if (d.small_business) return { id: 'E', reason: 'Kleinunternehmer gemäß § 19 UStG' };
  if (d.reverse_charge) return { id: 'AE', reason: 'Steuerschuldnerschaft des Leistungsempfängers' };
  if (Number(rate) === 0) return { id: 'Z' };
  return { id: 'S' };
}

function party(p) {
  return `
      <cbc:EndpointID schemeID="EM">${esc(p.email || 'unbekannt@example.com')}</cbc:EndpointID>
      <cac:PartyName><cbc:Name>${esc(p.name)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(p.street)}</cbc:StreetName>
        <cbc:CityName>${esc(p.city)}</cbc:CityName>
        <cbc:PostalZone>${esc(p.zip)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${esc(p.country || 'DE')}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${p.vat_id ? `
      <cac:PartyTaxScheme><cbc:CompanyID>${esc(p.vat_id)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}${p.tax_number ? `
      <cac:PartyTaxScheme><cbc:CompanyID>${esc(p.tax_number)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ''}
      <cac:PartyLegalEntity><cbc:RegistrationName>${esc(p.name)}</cbc:RegistrationName></cac:PartyLegalEntity>${p.contactName ? `
      <cac:Contact>
        <cbc:Name>${esc(p.contactName)}</cbc:Name>
        <cbc:Telephone>${esc(p.phone || '-')}</cbc:Telephone>
        <cbc:ElectronicMail>${esc(p.email)}</cbc:ElectronicMail>
      </cac:Contact>` : ''}`;
}

function build(d) {
  const s = settings.all();
  const snap = d.snapshot;
  const seller = {
    name: s.company_name, street: s.company_street, zip: s.company_zip, city: s.company_city, country: s.company_country,
    email: s.company_email, phone: s.company_phone, vat_id: s.company_vat_id, tax_number: s.company_vat_id ? '' : s.company_tax_number,
    contactName: s.company_owner || s.company_name,
  };
  const buyer = { ...snap, email: snap.invoice_email || snap.email, contactName: '' };
  const typeCode = d.kind === 'storno' ? '384' : '380';
  const taxes = d.calc.taxes;
  const prepaid = d.paid_total || 0;

  const lines = d.items.map((it) => {
    const cat = taxCategory(it.tax_rate, d);
    const netPrice = (it.unit_price * (1 - (it.discount_pct || 0) / 100)) / 100;
    return `
  <cac:InvoiceLine>
    <cbc:ID>${it.position}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${unitCode(it.unit)}">${Number(it.quantity)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${amt(it.net_amount)}</cbc:LineExtensionAmount>
    <cac:Item>${it.description ? `
      <cbc:Description>${esc(it.description)}</cbc:Description>` : ''}
      <cbc:Name>${esc(it.name)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${cat.id}</cbc:ID>
        <cbc:Percent>${Number(d.small_business || d.reverse_charge ? 0 : it.tax_rate)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price><cbc:PriceAmount currencyID="EUR">${netPrice.toFixed(4)}</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>`;
  }).join('');

  const subtotals = taxes.map((t) => {
    const cat = taxCategory(t.rate, d);
    return `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${amt(t.base)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${amt(t.tax)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${cat.id}</cbc:ID>
        <cbc:Percent>${Number(t.rate)}</cbc:Percent>${cat.reason ? `
        <cbc:TaxExemptionReason>${esc(cat.reason)}</cbc:TaxExemptionReason>` : ''}
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(d.number)}</cbc:ID>
  <cbc:IssueDate>${d.issue_date}</cbc:IssueDate>${d.due_date ? `
  <cbc:DueDate>${d.due_date}</cbc:DueDate>` : ''}
  <cbc:InvoiceTypeCode>${typeCode}</cbc:InvoiceTypeCode>${d.title ? `
  <cbc:Note>${esc(d.title)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:BuyerReference>${esc(snap.leitweg_id || snap.number || 'n/a')}</cbc:BuyerReference>${d.service_until ? `
  <cac:InvoicePeriod><cbc:StartDate>${d.service_date}</cbc:StartDate><cbc:EndDate>${d.service_until}</cbc:EndDate></cac:InvoicePeriod>` : ''}${d.ref_number ? `
  <cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${esc(d.ref_number)}</cbc:ID></cac:InvoiceDocumentReference></cac:BillingReference>` : ''}
  <cac:AccountingSupplierParty>
    <cac:Party>${party(seller)}
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>${party(buyer)}
    </cac:Party>
  </cac:AccountingCustomerParty>${!d.service_until && d.service_date ? `
  <cac:Delivery><cbc:ActualDeliveryDate>${d.service_date}</cbc:ActualDeliveryDate></cac:Delivery>` : ''}${s.bank_iban ? `
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cbc:PaymentID>${esc(d.number)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${esc(s.bank_iban.replace(/\s/g, ''))}</cbc:ID>
      <cbc:Name>${esc(s.company_name)}</cbc:Name>${s.bank_bic ? `
      <cac:FinancialInstitutionBranch><cbc:ID>${esc(s.bank_bic.replace(/\s/g, ''))}</cbc:ID></cac:FinancialInstitutionBranch>` : ''}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : ''}${d.due_date ? `
  <cac:PaymentTerms><cbc:Note>Zahlbar bis ${d.due_date.split('-').reverse().join('.')} ohne Abzug.</cbc:Note></cac:PaymentTerms>` : ''}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${amt(d.calc.tax)}</cbc:TaxAmount>${subtotals}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${amt(d.calc.net)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${amt(d.calc.net)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${amt(d.calc.gross)}</cbc:TaxInclusiveAmount>${prepaid ? `
    <cbc:PrepaidAmount currencyID="EUR">${amt(prepaid)}</cbc:PrepaidAmount>` : ''}
    <cbc:PayableAmount currencyID="EUR">${amt(d.calc.gross - prepaid)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>${lines}
</Invoice>
`;
}

module.exports = { build, unitCode };
