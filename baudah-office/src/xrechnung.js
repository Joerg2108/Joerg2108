'use strict';
/*
 * XRechnung 3.0 (EN 16931, UN/CEFACT CII) – E-Rechnung für B2B und öffentliche Auftraggeber.
 */
const calc = require('../public/js/calc');
const { getSetting } = require('./db');

const UNIT_CODES = {
  'm²': 'MTK', m2: 'MTK', qm: 'MTK',
  'm³': 'MTQ', m3: 'MTQ', cbm: 'MTQ',
  m: 'MTR', lfm: 'MTR', lfdm: 'MTR',
  stk: 'H87', 'stück': 'H87', st: 'H87',
  std: 'HUR', h: 'HUR',
  psch: 'LS', pauschal: 'LS', pausch: 'LS',
  kg: 'KGM', t: 'TNE', to: 'TNE',
  l: 'LTR', tag: 'DAY', tage: 'DAY', wo: 'WEE', woche: 'WEE',
  sack: 'H87', pal: 'H87',
};
const unitCode = (u) => UNIT_CODES[String(u || '').trim().toLowerCase()] || 'C62';

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const amt = (cents) => ((Number(cents) || 0) / 100).toFixed(2);
const d102 = (s) => String(s || '').slice(0, 10).replace(/-/g, '');
const num = (n, dec = 4) => Number(n || 0).toFixed(dec).replace(/\.?0+$/, '') || '0';

const TYPE_CODES = { rechnung: '380', schluss: '380', abschlag: '326', storno: '384' };

/** Prüft Pflichtangaben und liefert eine Liste mit Hinweisen */
function checkXRechnung(doc) {
  const c = getSetting('company');
  const issues = [];
  if (!doc.number) issues.push('Rechnung ist noch nicht festgeschrieben (keine Rechnungsnummer).');
  if (!c.vat_id && !c.tax_number) issues.push('Eigene Steuernummer oder USt-IdNr. fehlt (Einstellungen).');
  if (!c.iban) issues.push('Eigene IBAN fehlt (Einstellungen → Bank).');
  if (!c.email) issues.push('Eigene E-Mail-Adresse fehlt.');
  if (!c.phone) issues.push('Eigene Telefonnummer fehlt.');
  if (!doc.snapshot?.email) issues.push('E-Mail-Adresse des Kunden fehlt (elektronische Adresse BT-49).');
  if (!doc.snapshot?.zip || !doc.snapshot?.city) issues.push('Anschrift des Kunden unvollständig.');
  if (doc.tax_mode === '13b' && !doc.snapshot?.vat_id) issues.push('§ 13b: USt-IdNr. des Kunden fehlt.');
  return issues;
}

function party(tag, p) {
  return `<ram:${tag}>${p}</ram:${tag}>`;
}

function buildXRechnung(doc) {
  const c = getSetting('company');
  const snap = doc.snapshot || {};
  const reverse = doc.tax_mode === '13b';
  const items = calc.numberItems(doc.items).filter((i) => i.kind === 'item' && !i.optional);
  const t = doc.totals;
  const cat = (rate) => (reverse ? 'AE' : rate === 0 ? 'Z' : 'S');

  /* ---------- Positionen ---------- */
  const lines = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const rawTotal = calc.round(qty * it.price);
    const lineAllowance = rawTotal - it.total;
    const rate = reverse ? 0 : Number(it.vat_rate);
    return `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>${esc(it.posnr)}</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${esc(it.name || 'Leistung')}</ram:Name>${it.description ? `
        <ram:Description>${esc(it.description)}</ram:Description>` : ''}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice><ram:ChargeAmount>${amt(it.price)}</ram:ChargeAmount></ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="${unitCode(it.unit)}">${num(qty)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${cat(rate)}</ram:CategoryCode><ram:RateApplicablePercent>${num(rate, 2)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>${lineAllowance ? `
        <ram:SpecifiedTradeAllowanceCharge>
          <ram:ChargeIndicator><udt:Indicator>false</udt:Indicator></ram:ChargeIndicator>
          <ram:ActualAmount>${amt(lineAllowance)}</ram:ActualAmount>
          <ram:Reason>Nachlass ${num(it.discount, 2)} %</ram:Reason>
        </ram:SpecifiedTradeAllowanceCharge>` : ''}
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amt(it.total)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }).join('');

  /* ---------- Belegrabatt je Steuersatz ---------- */
  const baseByRate = new Map();
  for (const it of items) {
    const rate = reverse ? 0 : Number(it.vat_rate);
    baseByRate.set(rate, (baseByRate.get(rate) || 0) + it.total);
  }
  const allowances = t.vatGroups
    .map((g) => ({ rate: g.rate, amount: (baseByRate.get(g.rate) || 0) - g.net }))
    .filter((a) => a.amount)
    .map((a) => `
      <ram:SpecifiedTradeAllowanceCharge>
        <ram:ChargeIndicator><udt:Indicator>false</udt:Indicator></ram:ChargeIndicator>
        <ram:ActualAmount>${amt(a.amount)}</ram:ActualAmount>
        <ram:Reason>Rabatt ${num(doc.discount_percent, 2)} %</ram:Reason>
        <ram:CategoryTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${cat(a.rate)}</ram:CategoryCode><ram:RateApplicablePercent>${num(a.rate, 2)}</ram:RateApplicablePercent></ram:CategoryTradeTax>
      </ram:SpecifiedTradeAllowanceCharge>`)
    .join('');

  const taxes = t.vatGroups.map((g) => `
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amt(g.vat)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>${reverse ? `
        <ram:ExemptionReason>Steuerschuldnerschaft des Leistungsempfängers (§ 13b UStG)</ram:ExemptionReason>` : ''}
        <ram:BasisAmount>${amt(g.net)}</ram:BasisAmount>
        <ram:CategoryCode>${cat(g.rate)}</ram:CategoryCode>${reverse ? `
        <ram:ExemptionReasonCode>VATEX-EU-AE</ram:ExemptionReasonCode>` : ''}
        <ram:RateApplicablePercent>${num(g.rate, 2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>`).join('');

  const allowanceTotal = t.discount;
  const notes = [];
  if (doc.service_period) notes.push(`Leistungszeitraum: ${doc.service_period}`);
  if (doc.project) notes.push(`Bauvorhaben: ${doc.project}`);
  if (doc.site_address) notes.push(`Baustelle: ${doc.site_address}`);
  if (reverse) notes.push(getSetting('texts').reverse_charge);
  if (doc.show_35a && t.labor) notes.push(`Enthaltene Lohnkosten inkl. USt gem. § 35a EStG: ${calc.formatMoney(t.labor)}`);
  for (const a of doc.prepaid?.list || []) notes.push(`Abzug Abschlagsrechnung ${a.number} vom ${a.date}: ${calc.formatMoney(a.gross)}`);

  const sellerTax = [
    c.vat_id ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(c.vat_id.replace(/\s/g, ''))}</ram:ID></ram:SpecifiedTaxRegistration>` : '',
    c.tax_number ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(c.tax_number)}</ram:ID></ram:SpecifiedTaxRegistration>` : '',
  ].join('');

  const skonto =
    doc.skonto_percent && doc.skonto_days
      ? `#SKONTO#TAGE=${doc.skonto_days}#PROZENT=${Number(doc.skonto_percent).toFixed(2)}#\n`
      : '';
  const payTerms = `${skonto}Zahlbar bis ${doc.due_date ? doc.due_date.split('-').reverse().join('.') : ''} ohne Abzug.`;
  const buyerRef = snap.leitweg_id || doc.customer_ref || snap.number || 'n/a';
  const buyerName = snap.company || [snap.first_name, snap.last_name].filter(Boolean).join(' ') || snap.name || 'Kunde';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(doc.number)}</ram:ID>
    <ram:TypeCode>${TYPE_CODES[doc.type] || '380'}</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${d102(doc.date)}</udt:DateTimeString></ram:IssueDateTime>${notes.map((n) => `
    <ram:IncludedNote><ram:Content>${esc(n)}</ram:Content></ram:IncludedNote>`).join('')}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>${lines}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:BuyerReference>${esc(buyerRef)}</ram:BuyerReference>
      ${party('SellerTradeParty', `
        <ram:Name>${esc(c.name)}</ram:Name>
        <ram:DefinedTradeContact>
          <ram:PersonName>${esc(c.owner)}</ram:PersonName>
          <ram:TelephoneUniversalCommunication><ram:CompleteNumber>${esc(c.phone)}</ram:CompleteNumber></ram:TelephoneUniversalCommunication>
          <ram:EmailURIUniversalCommunication><ram:URIID>${esc(c.email)}</ram:URIID></ram:EmailURIUniversalCommunication>
        </ram:DefinedTradeContact>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(c.zip)}</ram:PostcodeCode>
          <ram:LineOne>${esc(c.street)}</ram:LineOne>
          <ram:CityName>${esc(c.city)}</ram:CityName>
          <ram:CountryID>${esc(c.country || 'DE')}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${esc(c.email)}</ram:URIID></ram:URIUniversalCommunication>
        ${sellerTax}`)}
      ${party('BuyerTradeParty', `
        <ram:ID>${esc(snap.number || '')}</ram:ID>
        <ram:Name>${esc(buyerName)}</ram:Name>${snap.contact_person ? `
        <ram:DefinedTradeContact><ram:PersonName>${esc(snap.contact_person)}</ram:PersonName></ram:DefinedTradeContact>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${esc(snap.zip)}</ram:PostcodeCode>
          <ram:LineOne>${esc(snap.street)}</ram:LineOne>
          <ram:CityName>${esc(snap.city)}</ram:CityName>
          <ram:CountryID>${esc(snap.country || 'DE')}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${esc(snap.email || 'keine-angabe@example.invalid')}</ram:URIID></ram:URIUniversalCommunication>${snap.vat_id ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(snap.vat_id.replace(/\s/g, ''))}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}`)}${doc.customer_ref ? `
      <ram:BuyerOrderReferencedDocument><ram:IssuerAssignedID>${esc(doc.customer_ref)}</ram:IssuerAssignedID></ram:BuyerOrderReferencedDocument>` : ''}${doc.source?.type === 'angebot' ? `
      <ram:AdditionalReferencedDocument><ram:IssuerAssignedID>${esc(doc.source.number)}</ram:IssuerAssignedID><ram:TypeCode>50</ram:TypeCode></ram:AdditionalReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${esc(doc.number)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>${c.iban ? '58' : '1'}</ram:TypeCode>${c.iban ? `
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${esc(c.iban.replace(/\s/g, ''))}</ram:IBANID>
          <ram:AccountName>${esc(c.account_holder || c.name)}</ram:AccountName>
        </ram:PayeePartyCreditorFinancialAccount>${c.bic ? `
        <ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${esc(c.bic)}</ram:BICID></ram:PayeeSpecifiedCreditorFinancialInstitution>` : ''}` : ''}
      </ram:SpecifiedTradeSettlementPaymentMeans>${taxes}${allowances}
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${esc(payTerms)}</ram:Description>${doc.due_date ? `
        <ram:DueDateDateTime><udt:DateTimeString format="102">${d102(doc.due_date)}</udt:DateTimeString></ram:DueDateDateTime>` : ''}
      </ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amt(t.subtotal)}</ram:LineTotalAmount>
        <ram:AllowanceTotalAmount>${amt(allowanceTotal)}</ram:AllowanceTotalAmount>
        <ram:TaxBasisTotalAmount>${amt(t.net)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amt(t.vat)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amt(t.gross)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${amt(t.prepaidGross)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${amt(t.payable)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>${doc.ref ? `
      <ram:InvoiceReferencedDocument>
        <ram:IssuerAssignedID>${esc(doc.ref.number)}</ram:IssuerAssignedID>
        <ram:FormattedIssueDateTime><qdt:DateTimeString format="102">${d102(doc.ref.date)}</qdt:DateTimeString></ram:FormattedIssueDateTime>
      </ram:InvoiceReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}

module.exports = { buildXRechnung, checkXRechnung, unitCode };
