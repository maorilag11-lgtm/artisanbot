import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 50,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2563EB' },
  companyInfo: { fontSize: 9, color: '#6B7280', marginTop: 4 },
  badge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: '4 10',
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'flex-start',
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#374151' },
  table: { marginTop: 16 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: '8 12',
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    padding: '8 12',
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  tableHeaderText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151' },
  totalSection: {
    alignItems: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
  },
  totalRow: { flexDirection: 'row', marginBottom: 6 },
  totalLabel: { width: 120, color: '#6B7280' },
  totalValue: { width: 80, textAlign: 'right' },
  grandTotal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB',
  },
  paymentBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    paddingTop: 12,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

interface InvoiceLine {
  description: string
  quantity: number
  unit_price: number
}

interface InvoicePDFProps {
  invoiceNumber: string
  artisan: {
    company_name: string
    trade: string
    phone: string
    address: string
    siret?: string
  }
  client: {
    name: string
    email: string
    phone?: string
    address?: string
  }
  lines: InvoiceLine[]
  createdAt: string
  dueDate: string
}

export function InvoicePDF({ invoiceNumber, artisan, client, lines, createdAt, dueDate }: InvoicePDFProps) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)
  const tva = subtotal * 0.2
  const total = subtotal + tva

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{artisan.company_name}</Text>
            <Text style={styles.companyInfo}>{artisan.trade}</Text>
            <Text style={styles.companyInfo}>{artisan.address}</Text>
            <Text style={styles.companyInfo}>Tél : {artisan.phone}</Text>
            {artisan.siret && <Text style={styles.companyInfo}>SIRET : {artisan.siret}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.badge}>FACTURE</Text>
            <Text style={{ marginTop: 8, fontSize: 10 }}>N° {invoiceNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 4 }}>
              Émise le {new Date(createdAt).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={{ fontSize: 9, color: '#D97706', marginTop: 2, fontFamily: 'Helvetica-Bold' }}>
              À régler avant le {new Date(dueDate).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Facturé à</Text>
          <Text>{client.name}</Text>
          {client.address && <Text style={{ color: '#6B7280', fontSize: 10 }}>{client.address}</Text>}
          {client.email && <Text style={{ color: '#6B7280', fontSize: 10 }}>{client.email}</Text>}
          {client.phone && <Text style={{ color: '#6B7280', fontSize: 10 }}>{client.phone}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderText, styles.colPrice]}>Prix unit. HT</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total HT</Text>
          </View>
          {lines.map((line, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{line.description}</Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colPrice}>{line.unit_price.toFixed(2)} €</Text>
              <Text style={styles.colTotal}>{(line.quantity * line.unit_price).toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA (20%)</Text>
            <Text style={styles.totalValue}>{tva.toFixed(2)} €</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Net à payer TTC</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        <View style={styles.paymentBox}>
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>Modalités de paiement</Text>
          <Text style={{ fontSize: 9, color: '#374151' }}>
            Règlement par virement bancaire, chèque ou espèces.
            En cas de retard, des pénalités de retard au taux légal en vigueur seront appliquées.
            Indemnité forfaitaire pour frais de recouvrement : 40 €.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>
            {artisan.company_name} — {artisan.address}
            {artisan.siret ? ` — SIRET : ${artisan.siret}` : ''}
            {' '}— Document généré via ArtisanBot
          </Text>
        </View>
      </Page>
    </Document>
  )
}
