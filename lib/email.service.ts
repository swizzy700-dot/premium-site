/**
 * Email Delivery Service
 * Sends professional audit reports via email
 * Captures leads for marketing
 */

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailReportData {
  to: string;
  url: string;
  title?: string;
  domain?: string;
  reportId: string;
  mobileScore: {
    overall: number;
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  riskLevel: string;
  executiveSummary: string;
}

/**
 * Send audit report via email
 */
export async function sendAuditReportEmail(data: EmailReportData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!resend) {
    return {
      success: false,
      error: 'Email service not configured. Please set RESEND_API_KEY.',
    };
  }

  try {
    const { data: result, error } = await resend.emails.send({
      from: 'WebIntel <reports@webintel.io>',
      to: data.to,
      subject: `Website Analysis Report: ${data.title || data.domain}`,
      html: generateEmailHTML(data),
    });

    if (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: result?.id,
    };
  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Generate professional email HTML
 */
function generateEmailHTML(data: EmailReportData): string {
  const grade = getGrade(data.mobileScore.overall);
  const gradeColor = getGradeColor(data.mobileScore.overall);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your WebIntel Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f1f5f9;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      color: #dbeafe;
      margin: 10px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 40px 30px;
    }
    .site-info {
      background-color: #f8fafc;
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 8px;
    }
    .site-info h2 {
      margin: 0 0 8px 0;
      color: #0f172a;
      font-size: 20px;
    }
    .site-info p {
      margin: 0;
      color: #64748b;
      font-size: 14px;
    }
    .score-section {
      text-align: center;
      margin: 30px 0;
    }
    .score-circle {
      display: inline-block;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      line-height: 120px;
      font-size: 48px;
      font-weight: 700;
      color: #ffffff;
      background-color: ${gradeColor};
      margin-bottom: 10px;
    }
    .score-label {
      font-size: 14px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .executive-summary {
      background-color: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .executive-summary h3 {
      color: #1e40af;
      margin: 0 0 12px 0;
      font-size: 16px;
    }
    .executive-summary p {
      margin: 0;
      color: #475569;
      font-size: 14px;
    }
    .cta-button {
      display: block;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      margin: 30px 0;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #1d4ed8;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #64748b;
      font-size: 12px;
      margin: 0;
    }
    .score-breakdown {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
    }
    .score-item {
      text-align: center;
    }
    .score-value {
      font-size: 24px;
      font-weight: 700;
      color: #0f172a;
    }
    .score-name {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WebIntel</h1>
      <p>Professional Website Intelligence Report</p>
    </div>
    
    <div class="content">
      <div class="site-info">
        <h2>${data.title || data.domain || 'Website Analysis'}</h2>
        <p>${data.domain || data.url}</p>
      </div>
      
      <div class="score-section">
        <div class="score-circle">${grade}</div>
        <div class="score-label">Overall Score: ${data.mobileScore.overall}/100</div>
      </div>
      
      <div class="score-breakdown">
        <div class="score-item">
          <div class="score-value">${data.mobileScore.performance}</div>
          <div class="score-name">Performance</div>
        </div>
        <div class="score-item">
          <div class="score-value">${data.mobileScore.accessibility}</div>
          <div class="score-name">Accessibility</div>
        </div>
        <div class="score-item">
          <div class="score-value">${data.mobileScore.bestPractices}</div>
          <div class="score-name">Best Practices</div>
        </div>
        <div class="score-item">
          <div class="score-value">${data.mobileScore.seo}</div>
          <div class="score-name">SEO</div>
        </div>
      </div>
      
      <div class="executive-summary">
        <h3>📊 Executive Summary</h3>
        <p>${data.executiveSummary}</p>
      </div>
      
      <a href="https://webintel.io/report/${data.reportId}" class="cta-button">
        View Full Report with AI Insights
      </a>
      
      <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
        This report was generated by WebIntel's advanced website intelligence engine.
      </p>
    </div>
    
    <div class="footer">
      <p>© 2025 WebIntel. All rights reserved.</p>
      <p style="margin-top: 8px;">webintel.io</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getGradeColor(score: number): string {
  if (score >= 90) return '#16a34a'; // Green
  if (score >= 75) return '#2563eb'; // Blue
  if (score >= 60) return '#d97706'; // Amber
  return '#dc2626'; // Red
}

/**
 * Store lead information when email is submitted
 */
export async function captureLead(params: {
  email: string;
  url?: string;
  source: 'report_email' | 'waitlist' | 'newsletter';
  metadata?: Record<string, unknown>;
}): Promise<void> {
  // This is where you'd store the lead in your database
  // or send to your CRM/marketing platform
  console.log('Lead captured:', params);
}
