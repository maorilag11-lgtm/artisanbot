import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

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
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 8, color: '#374151' },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#6B7280' },
  value: { flex: 1 },
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
  badge: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    padding: '4 10',
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    alignSelf: 'flex-start',
  },
  validityNote: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
})

interface QuoteLine {
  description: string
  quantity: number
  unit_price: number
}

interface QuotePDFProps {
  quoteNumber: string
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
  lines: QuoteLine[]
  createdAt: string
  validUntil?: string
}

export function QuotePDF({ quoteNumber, artisan, client, lines, createdAt, validUntil }: QuotePDFProps) {
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0)
  const tva = subtotal * 0.2
  const total = subtotal + tva

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{artisan.company_name}</Text>
            <Text style={styles.companyInfo}>{artisan.trade}</Text>
            <Text style={styles.companyInfo}>{artisan.address}</Text>
            <Text style={styles.companyInfo}>Tél : {artisan.phone}</Text>
            {artisan.siret && <Text style={styles.companyInfo}>SIRET : {artisan.siret}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.badge}>DEVIS</Text>
            <Text style={{ marginTop: 8, fontSize: 10 }}>N° {quoteNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 4 }}>
              Émis le {new Date(createdAt).toLocaleDateString('fr-FR')}
            </Text>
            {validUntil && (
              <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>
                Valide jusqu&apos;au {new Date(validUntil).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        </View>

        {/* Client info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destinataire</Text>
          <Text>{client.name}</Text>
          {client.address && <Text style={{ color: '#6B7280', fontSize: 10 }}>{client.address}</Text>}
          {client.email && <Text style={{ color: '#6B7280', fontSize: 10 }}>{client.email}</Text>}
          {client.phone && <Text style={{ color: '#6B7280', fontSize: 10 }}>{client.phone}</Text>}
        </View>

        {/* Lines table */}
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

        {/* Totals */}
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
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total TTC</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        <Text style={styles.validityNote}>
          Ce devis est valable 30 jours à compter de sa date d&apos;émission.
          Conditions de paiement : 30% à la commande, solde à la livraison.
        </Text>

        {/* Footer */}
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
