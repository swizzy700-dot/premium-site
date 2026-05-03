/**
 * PDF Report Generation Service
 * Creates professional, client-ready PDF reports
 */

import { jsPDF } from 'jspdf';
import type { IntelligenceAnalysis } from './intelligence.engine.v2';

interface PDFReportData {
  url: string;
  title?: string;
  domain?: string;
  screenshot?: string;
  mobileScore: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    overall: number;
  };
  desktopScore: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    overall: number;
  };
  analysis: IntelligenceAnalysis;
  generatedAt: string;
}

export async function generatePDFReport(data: PDFReportData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = margin;

  // Brand Header
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('WebIntel', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Website Intelligence Report', margin, 32);

  currentY = 50;

  // Website Info Section
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title || data.domain || 'Website Analysis', margin, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(data.domain || data.url, margin, currentY);
  
  currentY += 5;
  doc.setFontSize(8);
  doc.text(`Generated: ${data.generatedAt}`, margin, currentY);

  currentY += 15;

  // Executive Summary Box
  doc.setFillColor(240, 249, 255); // Blue-50
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'FD');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Executive Summary', margin + 5, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // Slate-600
  
  const summaryLines = doc.splitTextToSize(data.analysis.executiveSummary, contentWidth - 10);
  doc.text(summaryLines, margin + 5, currentY + 15);

  currentY += 45;

  // Mobile-First Notice
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Mobile-First Analysis', margin + 5, currentY + 7);
  
  currentY += 18;

  // Performance Scores Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Performance Scores', margin, currentY);

  currentY += 10;

  // Mobile Scores Box
  const scoreBoxHeight = 40;
  const scoreBoxWidth = contentWidth / 2 - 5;

  // Mobile Box
  doc.setFillColor(254, 243, 199); // Amber-100
  doc.setDrawColor(253, 186, 116); // Amber-300
  doc.roundedRect(margin, currentY, scoreBoxWidth, scoreBoxHeight, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14); // Amber-800
  doc.text('MOBILE (Primary)', margin + 5, currentY + 7);

  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text(`${data.mobileScore.overall}`, margin + 5, currentY + 22);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`P: ${data.mobileScore.performance}  A: ${data.mobileScore.accessibility}`, margin + 5, currentY + 30);
  doc.text(`BP: ${data.mobileScore.bestPractices}  S: ${data.mobileScore.seo}`, margin + 5, currentY + 35);

  // Desktop Box
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.roundedRect(margin + scoreBoxWidth + 10, currentY, scoreBoxWidth, scoreBoxHeight, 3, 3, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DESKTOP', margin + scoreBoxWidth + 15, currentY + 7);

  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text(`${data.desktopScore.overall}`, margin + scoreBoxWidth + 15, currentY + 22);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`P: ${data.desktopScore.performance}  A: ${data.desktopScore.accessibility}`, margin + scoreBoxWidth + 15, currentY + 30);
  doc.text(`BP: ${data.desktopScore.bestPractices}  S: ${data.desktopScore.seo}`, margin + scoreBoxWidth + 15, currentY + 35);

  currentY += scoreBoxHeight + 10;

  // Check if we need a new page
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  // Business Impact Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Business Impact Analysis', margin, currentY);

  currentY += 10;

  data.analysis.businessImpact.slice(0, 3).forEach((insight) => {
    const boxColor = insight.severity === 'critical' ? [254, 226, 226] : // Red-100
                    insight.severity === 'high' ? [254, 243, 199] : // Amber-100
                    [224, 242, 254]; // Blue-100
    
    const borderColor = insight.severity === 'critical' ? [252, 165, 165] :
                       insight.severity === 'high' ? [253, 186, 116] :
                       [147, 197, 253];

    doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.roundedRect(margin, currentY, contentWidth, 30, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${insight.category.toUpperCase()} - ${insight.severity.toUpperCase()}`, margin + 5, currentY + 6);

    doc.setFontSize(9);
    doc.text(insight.finding, margin + 5, currentY + 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const impactLines = doc.splitTextToSize(insight.impact, contentWidth - 10);
    doc.text(impactLines, margin + 5, currentY + 18);

    currentY += 35;
  });

  // Check for new page
  if (currentY > pageHeight - 80) {
    doc.addPage();
    currentY = margin;
  }

  // Strategic Recommendations
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Strategic Recommendations', margin, currentY);

  currentY += 10;

  data.analysis.strategicRecommendations.slice(0, 4).forEach((rec, index) => {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 25, 2, 2, 'FD');

    // Priority number
    doc.setFillColor(37, 99, 235);
    doc.circle(margin + 10, currentY + 10, 4, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${rec.priority}`, margin + 8, currentY + 11.5);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(rec.title, margin + 20, currentY + 7);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const rationaleLines = doc.splitTextToSize(rec.rationale, contentWidth - 25);
    doc.text(rationaleLines, margin + 20, currentY + 12);

    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(`Effort: ${rec.effort}  |  Impact: ${rec.impact}`, margin + 20, currentY + 22);

    currentY += 30;
  });

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`WebIntel Report • Page ${i} of ${pageCount}`, margin, pageHeight - 10);
    doc.text('webintel.io', pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  return doc.output('blob');
}
