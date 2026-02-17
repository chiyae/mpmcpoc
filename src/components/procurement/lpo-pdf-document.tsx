
'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import type { LocalPurchaseOrder } from '@/lib/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#fff',
    color: '#333'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  clinicName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB', // A blue color similar to primary
  },
  clinicDetails: {
    fontSize: 9,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  lpoTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#999',
    textTransform: 'uppercase',
  },
  lpoInfo: {
    marginTop: 4,
    fontSize: 9,
    color: '#666',
  },
  lpoInfoText: {
    fontFamily: 'Helvetica-Bold',
  },
  vendorSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  vendorBox: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#f9f9f9'
  },
  vendorName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden'
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f4f4f5', // muted bg
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tableColHeader: {
    padding: 6,
    fontFamily: 'Helvetica-Bold',
  },
  tableCol: {
    padding: 6,
  },
  colDescription: {
    width: '50%',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
  },
  colQty: {
    width: '15%',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    textAlign: 'center',
  },
  colPrice: {
    width: '17.5%',
    borderRightWidth: 1,
    borderRightColor: '#e5e5e5',
    textAlign: 'right',
  },
  colTotal: {
    width: '17.5%',
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalBox: {
    width: '40%',
    backgroundColor: '#f4f4f5',
    padding: 10,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  signatureSection: {
    marginTop: 60,
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '40%',
    flexDirection: 'column',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 40,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
  }
});

interface LpoPdfDocumentProps {
  lpo: LocalPurchaseOrder;
  settings: any;
  formatCurrency: (amount: number) => string;
}

const LpoPdfDocument: React.FC<LpoPdfDocumentProps> = ({ lpo, settings, formatCurrency }) => {
    return (
        <Document title={`LPO-${lpo.lpoNumber}`} author={settings?.clinicName}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.clinicName}>{settings?.clinicName || 'Your Clinic Name'}</Text>
                        <Text style={styles.clinicDetails}>{settings?.clinicAddress}</Text>
                        <Text style={styles.clinicDetails}>Tel: {settings?.clinicPhone}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.lpoTitle}>LPO</Text>
                        <Text style={styles.lpoInfo}><Text style={styles.lpoInfoText}>LPO #:</Text> {lpo.lpoNumber}</Text>
                        <Text style={styles.lpoInfo}><Text style={styles.lpoInfoText}>Date:</Text> {new Date(lpo.date).toLocaleDateString()}</Text>
                        <Text style={styles.lpoInfo}><Text style={styles.lpoInfoText}>Status:</Text> {lpo.status}</Text>
                    </View>
                </View>

                {/* Vendor Info */}
                <View style={styles.vendorSection}>
                  <Text style={styles.sectionTitle}>VENDOR</Text>
                  <View style={styles.vendorBox}>
                    <Text style={styles.vendorName}>{lpo.vendorName}</Text>
                  </View>
                </View>
                
                {/* Items Table */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.tableHeader]} fixed>
                        <View style={[styles.tableColHeader, styles.colDescription]}><Text>ITEM DESCRIPTION</Text></View>
                        <View style={[styles.tableColHeader, styles.colQty]}><Text>QTY</Text></View>
                        <View style={[styles.tableColHeader, styles.colPrice]}><Text>UNIT PRICE</Text></View>
                        <View style={[styles.tableColHeader, styles.colTotal]}><Text>TOTAL</Text></View>
                    </View>
                    {/* Table Body */}
                    {lpo.items.map(item => (
                        <View style={styles.tableRow} key={item.itemId}>
                            <View style={[styles.tableCol, styles.colDescription]}><Text>{item.itemName}</Text></View>
                            <View style={[styles.tableCol, styles.colQty]}><Text>{item.quantity}</Text></View>
                            <View style={[styles.tableCol, styles.colPrice]}><Text>{formatCurrency(item.unitPrice)}</Text></View>
                            <View style={[styles.tableCol, styles.colTotal]}><Text>{formatCurrency(item.total)}</Text></View>
                        </View>
                    ))}
                </View>

                {/* Grand Total */}
                <View style={styles.footer}>
                  <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Grand Total</Text>
                      <Text style={styles.totalValue}>{formatCurrency(lpo.grandTotal)}</Text>
                    </View>
                  </View>
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                           <Text style={styles.signatureLabel}>Authorized Signature</Text>
                        </View>
                    </View>
                     <View style={styles.signatureBox}>
                        <View style={styles.signatureLine}>
                           <Text style={styles.signatureLabel}>Vendor Signature</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export default LpoPdfDocument;
