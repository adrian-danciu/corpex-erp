import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Invoice, InvoiceItem } from "@/types/finance.types";
import { InvoiceType } from "@/types/finance.types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
    padding: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  companyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  invoiceType: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  metaRight: {
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 3,
  },
  metaLabel: {
    color: "#64748b",
    width: 80,
    textAlign: "right",
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 20,
  },
  twoCol: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  col: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  partnerName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  partnerDetail: {
    color: "#475569",
    marginBottom: 2,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  colIndex: { width: 20 },
  colDesc: { flex: 1 },
  colQty: { width: 36, textAlign: "right" },
  colUnit: { width: 36 },
  colPrice: { width: 70, textAlign: "right" },
  colVat: { width: 36, textAlign: "right" },
  colAmount: { width: 70, textAlign: "right" },
  colVatAmt: { width: 60, textAlign: "right" },
  thText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    color: "#64748b",
  },
  totalsDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  paidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    color: "#16a34a",
  },
  outstandingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    color: "#b45309",
  },
  outstandingText: {
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
  },
  notesBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

function fmt(amount: number, currency = "EUR") {
  return `${amount.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ro-RO");
}

interface Props {
  invoice: Invoice;
}

export function InvoicePDF({ invoice }: Props) {
  const invoiceNumber = `${invoice.series}-${String(invoice.number).padStart(4, "0")}`;
  const remaining = invoice.total - invoice.paidAmount;
  const invoiceLabel = invoice.invoiceType === InvoiceType.FISCAL ? "Fiscal Invoice" : "Proforma Invoice";

  return (
    <Document title={`Invoice ${invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>CORPEX</Text>
            <Text style={styles.invoiceType}>{invoiceLabel}</Text>
            <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
          </View>
          <View style={styles.metaRight}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issue Date:</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.dueDate)}</Text>
            </View>
            {invoice.deliveryDate && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Delivery:</Text>
                <Text style={styles.metaValue}>{fmtDate(invoice.deliveryDate)}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Currency:</Text>
              <Text style={styles.metaValue}>{invoice.currency}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Partner + Created By */}
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.partnerName}>{invoice.partner.name}</Text>
            <Text style={styles.partnerDetail}>CUI: {invoice.partner.cui}</Text>
            {invoice.partner.regCom ? (
              <Text style={styles.partnerDetail}>Reg. Com.: {invoice.partner.regCom}</Text>
            ) : null}
            <Text style={styles.partnerDetail}>{invoice.partner.address}</Text>
            <Text style={styles.partnerDetail}>{invoice.partner.city}, {invoice.partner.country}</Text>
            {invoice.partner.bankAccount ? (
              <Text style={styles.partnerDetail}>IBAN: {invoice.partner.bankAccount}</Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Created By</Text>
            <Text style={styles.partnerName}>
              {invoice.createdBy.firstName} {invoice.createdBy.lastName}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colIndex]}>#</Text>
            <Text style={[styles.thText, styles.colDesc]}>Description</Text>
            <Text style={[styles.thText, styles.colQty]}>Qty</Text>
            <Text style={[styles.thText, styles.colUnit]}>Unit</Text>
            <Text style={[styles.thText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.thText, styles.colVat]}>VAT%</Text>
            <Text style={[styles.thText, styles.colAmount]}>Amount</Text>
            <Text style={[styles.thText, styles.colVatAmt]}>VAT</Text>
          </View>
          {invoice.items.map((item: InvoiceItem, i: number) => (
            <View key={item.id} style={[styles.tableRow, i % 2 !== 0 ? styles.tableRowAlt : {}]}>
              <Text style={styles.colIndex}>{i + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>{fmt(item.unitPrice, invoice.currency)}</Text>
              <Text style={styles.colVat}>{item.vatRate}%</Text>
              <Text style={styles.colAmount}>{fmt(item.amount, invoice.currency)}</Text>
              <Text style={styles.colVatAmt}>{fmt(item.vatAmount, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal:</Text>
              <Text>{fmt(invoice.subtotal, invoice.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT:</Text>
              <Text>{fmt(invoice.vatTotal, invoice.currency)}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{fmt(invoice.total, invoice.currency)}</Text>
            </View>
            <View style={styles.paidRow}>
              <Text>Paid:</Text>
              <Text>{fmt(invoice.paidAmount, invoice.currency)}</Text>
            </View>
            <View style={styles.outstandingRow}>
              <Text style={styles.outstandingText}>Outstanding:</Text>
              <Text style={styles.outstandingText}>{fmt(remaining, invoice.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by Corpex ERP</Text>
          <Text style={styles.footerText}>{invoiceNumber} — {invoiceLabel}</Text>
        </View>
      </Page>
    </Document>
  );
}
