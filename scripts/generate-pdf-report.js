/**
 * Script de génération de rapport QA Exécutif en HTML et PDF
 * Utilise Playwright headless Chromium pour convertir le HTML en PDF A4 professionnel.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

async function main() {
  console.log('🚀 Démarrage de la génération du rapport PDF...');

  const outputDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Collecte des métriques d'exécution
  const metrics = collectMetrics();
  console.log('📊 Métriques collectées :', JSON.stringify(metrics.summary, null, 2));

  // 2. Génération du code HTML du rapport exécutif
  const htmlContent = buildHtmlReport(metrics);
  const htmlPath = path.join(outputDir, 'qa-executive-report.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`✅ Rapport HTML sauvegardé : ${htmlPath}`);

  // 3. Conversion en PDF avec Playwright
  const pdfPath = path.join(outputDir, 'qa-test-report.pdf');
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '15mm',
        right: '15mm',
      },
    });

    await browser.close();
    console.log(`📄 Rapport PDF généré avec succès : ${pdfPath}`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF :', error);
    process.exit(1);
  }
}

function collectMetrics() {
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    durationMs: 0,
    passRate: 0,
  };

  const suites = [];
  const failures = [];

  // Essai 1: Lire depuis allure-report/widgets/summary.json si Allure a été généré
  const allureSummaryPath = path.resolve(process.cwd(), 'allure-report/widgets/summary.json');
  const allureSuitesPath = path.resolve(process.cwd(), 'allure-report/data/suites.json');

  if (fs.existsSync(allureSummaryPath)) {
    try {
      const allureSummary = JSON.parse(fs.readFileSync(allureSummaryPath, 'utf-8'));
      const stat = allureSummary.statistic || {};
      summary.passed = stat.passed || 0;
      summary.failed = (stat.failed || 0) + (stat.broken || 0);
      summary.skipped = (stat.skipped || 0) + (stat.unknown || 0);
      summary.total = stat.total || (summary.passed + summary.failed + summary.skipped);
      summary.durationMs = allureSummary.time ? allureSummary.time.duration : 0;
    } catch (e) {
      console.warn('⚠️ Impossible de parser summary.json Allure:', e.message);
    }
  }

  // Essai 2: Lire les résultats Playwright JSON (test-results/results.json)
  const playwrightJsonPath = path.resolve(process.cwd(), 'test-results/results.json');
  if (fs.existsSync(playwrightJsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(playwrightJsonPath, 'utf-8'));
      if (summary.total === 0 && data.suites) {
        parsePlaywrightSuites(data.suites, suites, failures, summary);
      }
    } catch (e) {
      console.warn('⚠️ Impossible de parser test-results/results.json:', e.message);
    }
  }

  // Si Allure suites existe, on enrichit
  if (suites.length === 0 && fs.existsSync(allureSuitesPath)) {
    try {
      const allureSuites = JSON.parse(fs.readFileSync(allureSuitesPath, 'utf-8'));
      if (allureSuites.children) {
        for (const s of allureSuites.children) {
          const suiteObj = {
            name: s.name,
            total: (s.children || []).length,
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: [],
          };
          for (const t of s.children || []) {
            const status = t.status === 'passed' ? 'passed' : (t.status === 'failed' || t.status === 'broken' ? 'failed' : 'skipped');
            if (status === 'passed') suiteObj.passed++;
            else if (status === 'failed') suiteObj.failed++;
            else suiteObj.skipped++;

            suiteObj.tests.push({
              name: t.name,
              status: status,
              durationMs: t.time ? t.time.duration : 0,
            });

            if (status === 'failed') {
              failures.push({
                suite: s.name,
                name: t.name,
                error: t.statusDetails ? t.statusDetails.message : 'Échec sans détails',
              });
            }
          }
          suites.push(suiteObj);
        }
      }
    } catch (e) {
      console.warn('⚠️ Impossible de parser suites.json Allure:', e.message);
    }
  }

  summary.passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 100;

  // Données contextuelles de l'exécution CI/CD
  const runInfo = {
    repo: process.env.GITHUB_REPOSITORY || 'etienne201/qa-assessment-automation',
    runId: process.env.GITHUB_RUN_ID || 'LocalRun',
    runNumber: process.env.GITHUB_RUN_NUMBER || '1',
    branch: process.env.GITHUB_REF_NAME || 'main',
    commit: (process.env.GITHUB_SHA || 'dev-local').substring(0, 7),
    actor: process.env.GITHUB_ACTOR || 'CI-Scheduler',
    workflow: process.env.GITHUB_WORKFLOW || 'Playwright QA Tests',
    targetUrl: process.env.BASE_URL || 'https://qa-assessment.pages.dev/',
    executedAt: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
    htmlReportUrl: process.env.REPORT_URL || `https://${(process.env.GITHUB_REPOSITORY_OWNER || 'etienne201')}.github.io/qa-assessment-automation/`,
    githubRunUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : 'https://github.com/etienne201/qa-assessment-automation/actions',
  };

  return { summary, suites, failures, runInfo };
}

function parsePlaywrightSuites(pwSuites, suitesOut, failuresOut, summary) {
  for (const s of pwSuites) {
    const suiteName = s.title || path.basename(s.file || 'Tests');
    const suiteObj = {
      name: suiteName,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: [],
    };

    if (s.specs) {
      for (const spec of s.specs) {
        for (const test of spec.tests || []) {
          suiteObj.total++;
          summary.total++;
          const lastResult = (test.results && test.results[test.results.length - 1]) || {};
          const status = lastResult.status === 'passed' ? 'passed' : (lastResult.status === 'skipped' ? 'skipped' : 'failed');
          const duration = lastResult.duration || 0;
          summary.durationMs += duration;

          if (status === 'passed') {
            suiteObj.passed++;
            summary.passed++;
          } else if (status === 'skipped') {
            suiteObj.skipped++;
            summary.skipped++;
          } else {
            suiteObj.failed++;
            summary.failed++;
            failuresOut.push({
              suite: suiteName,
              name: spec.title,
              error: lastResult.error ? (lastResult.error.message || lastResult.error.value) : 'Test échoué',
            });
          }

          suiteObj.tests.push({
            name: spec.title,
            status,
            durationMs: duration,
          });
        }
      }
    }

    if (s.suites) {
      parsePlaywrightSuites(s.suites, suitesOut, failuresOut, summary);
    }

    if (suiteObj.total > 0) {
      suitesOut.push(suiteObj);
    }
  }
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function buildHtmlReport({ summary, suites, failures, runInfo }) {
  const isSuccess = summary.failed === 0;
  const statusColor = isSuccess ? '#10b981' : '#ef4444';
  const statusBg = isSuccess ? '#ecfdf5' : '#fef2f2';
  const statusText = isSuccess ? 'SUCCÈS' : 'ÉCHEC DÉTECTÉ';
  const statusIcon = isSuccess ? '✅' : '❌';

  const suitesHtml = suites.length > 0 ? suites.map(s => `
    <div class="suite-card">
      <div class="suite-header">
        <span class="suite-name">${escapeHtml(s.name)}</span>
        <div class="suite-badges">
          <span class="badge badge-passed">${s.passed} réussi${s.passed > 1 ? 's' : ''}</span>
          ${s.failed > 0 ? `<span class="badge badge-failed">${s.failed} échoué${s.failed > 1 ? 's' : ''}</span>` : ''}
          ${s.skipped > 0 ? `<span class="badge badge-skipped">${s.skipped} ignoré${s.skipped > 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>
      <table class="test-table">
        <thead>
          <tr>
            <th>Test</th>
            <th style="width: 100px; text-align: center;">Statut</th>
            <th style="width: 80px; text-align: right;">Durée</th>
          </tr>
        </thead>
        <tbody>
          ${s.tests.map(t => `
            <tr>
              <td>${escapeHtml(t.name)}</td>
              <td style="text-align: center;">
                <span class="status-pill status-${t.status}">${t.status.toUpperCase()}</span>
              </td>
              <td style="text-align: right; color: #64748b;">${formatDuration(t.durationMs)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('') : '<p class="empty-state">Détails des suites de tests non disponibles ou intégrés au rapport Allure.</p>';

  const failuresHtml = failures.length > 0 ? `
    <div class="section">
      <h2 class="section-title failure-title">🚨 Détail des Anomalies (${failures.length})</h2>
      ${failures.map(f => `
        <div class="failure-card">
          <div class="failure-title-text">${escapeHtml(f.suite)} &rsaquo; ${escapeHtml(f.name)}</div>
          <pre class="failure-pre"><code>${escapeHtml(f.error)}</code></pre>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Exécutif de Tests QA - CI/CD</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      padding: 24px;
      line-height: 1.5;
      font-size: 13px;
    }
    .header-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .status-banner {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      background: ${statusBg};
      color: ${statusColor};
      border: 1px solid ${statusColor}40;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .meta-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .meta-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 12px;
      font-weight: 600;
      color: #0f172a;
      word-break: break-all;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .kpi-number {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 6px;
    }
    .kpi-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
    }
    .kpi-pass { color: #10b981; }
    .kpi-fail { color: #ef4444; }
    .kpi-skip { color: #f59e0b; }
    .kpi-total { color: #3b82f6; }

    .cta-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 14px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cta-text {
      color: #1e40af;
      font-size: 13px;
      font-weight: 500;
    }
    .cta-btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(37,99,235,0.2);
    }

    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .failure-title { color: #dc2626; }
    .failure-card {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .failure-title-text {
      font-weight: 700;
      color: #991b1b;
      font-size: 13px;
      margin-bottom: 6px;
    }
    .failure-pre {
      background: #450a0a;
      color: #fecaca;
      padding: 10px;
      border-radius: 6px;
      font-size: 11px;
      overflow-x: auto;
      white-space: pre-wrap;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .suite-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 14px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .suite-header {
      background: #f1f5f9;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .suite-name {
      font-weight: 700;
      font-size: 13px;
      color: #334155;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      margin-left: 4px;
    }
    .badge-passed { background: #dcfce7; color: #15803d; }
    .badge-failed { background: #fee2e2; color: #b91c1c; }
    .badge-skipped { background: #fef3c7; color: #b45309; }

    .test-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .test-table th {
      background: #f8fafc;
      padding: 8px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .test-table td {
      padding: 8px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .status-pill {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
    }
    .status-passed { background: #dcfce7; color: #15803d; }
    .status-failed { background: #fee2e2; color: #b91c1c; }
    .status-skipped { background: #fef3c7; color: #b45309; }

    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 11px;
    }
    .footer a { color: #64748b; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    @media print {
      body { background: #ffffff; padding: 0; font-size: 11px; }
      .header-container, .meta-card, .kpi-card, .suite-card { box-shadow: none !important; }
      .cta-btn { display: none; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-container">
    <div class="header-left">
      <h1>⚡ Rapport Exécutif d'Automatisation QA</h1>
      <div class="header-subtitle">Application cible : <strong>${escapeHtml(runInfo.targetUrl)}</strong> | Projet : <strong>User Profile Form</strong></div>
    </div>
    <div class="status-banner">
      <span>${statusIcon}</span>
      <span>${statusText}</span>
    </div>
  </div>

  <!-- Meta Info -->
  <div class="meta-grid">
    <div class="meta-card">
      <div class="meta-label">📅 Date & Heure</div>
      <div class="meta-value">${escapeHtml(runInfo.executedAt)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">🌿 Branche / Commit</div>
      <div class="meta-value">${escapeHtml(runInfo.branch)} (${escapeHtml(runInfo.commit)})</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">⏱️ Durée Totale</div>
      <div class="meta-value">${formatDuration(summary.durationMs)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-label">👤 Déclencheur CI</div>
      <div class="meta-value">${escapeHtml(runInfo.actor)}</div>
    </div>
  </div>

  <!-- KPI Cards -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-number kpi-total">${summary.total}</div>
      <div class="kpi-label">Tests Exécutés</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-number kpi-pass">${summary.passed}</div>
      <div class="kpi-label">Succès (${summary.passRate}%)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-number kpi-fail">${summary.failed}</div>
      <div class="kpi-label">Échecs</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-number kpi-skip">${summary.skipped}</div>
      <div class="kpi-label">Ignorés</div>
    </div>
  </div>

  <!-- CTA Banner vers le rapport HTML interactif -->
  <div class="cta-banner">
    <div class="cta-text">
      🌐 <strong>Rapport HTML Interactif Allure disponible en ligne :</strong> visualisez les vidéos, captures d'écran et traces réseau des tests.
    </div>
    <a href="${runInfo.htmlReportUrl}" class="cta-btn" target="_blank">Consulter le Rapport HTML &rarr;</a>
  </div>

  <!-- Failures Section (si échecs) -->
  ${failuresHtml}

  <!-- Test Suites Details -->
  <div class="section">
    <h2 class="section-title">📋 Récapitulatif des Suites de Tests</h2>
    ${suitesHtml}
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>Généré automatiquement par le pipeline CI/CD GitHub Actions • Planification quotidienne (7h, 9h, 13h)</div>
    <div>
      <a href="${runInfo.htmlReportUrl}">Rapport HTML</a> • 
      <a href="${runInfo.githubRunUrl}">GitHub Actions Run #${runInfo.runNumber}</a>
    </div>
  </div>

</body>
</html>
`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
