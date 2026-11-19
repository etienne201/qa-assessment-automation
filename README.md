# QA Automation — User Profile Form

### Playwright + TypeScript + Allure Reporting

Automated end-to-end testing project for the **User Profile Form** application using:

- Playwright
- TypeScript
- Page Object Model (POM)
- Allure Reporting
- GitHub Actions CI/CD
- Multi-browser execution

---

## Application Under Test

```txt
https://qa-assessment.pages.dev/
```

---

## CI/CD Status

[![Playwright Tests](https://github.com/YOUR_USERNAME/qa-assessment-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/YOUR_USERNAME/qa-assessment-automation/actions)

---

# Prerequisites

| Tool | Minimum Version | Verify |
|------|----------------|--------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | Latest | `git --version` |
| Java | 17+ (for Allure) | `java -version` |

---

# Installation Guide

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/qa-assessment-automation.git

cd qa-assessment-automation
```

---

## 2. Install Dependencies

```bash
npm ci
```

Recommended for reproducible installations.

---

## 3. Install Playwright Browsers

### Install all browsers

```bash
npx playwright install --with-deps
```

### Install specific browsers only

```bash
npx playwright install chromium --with-deps
npx playwright install firefox --with-deps
npx playwright install webkit --with-deps
```

---

# Allure Installation

## macOS

```bash
brew install allure
```

## Windows

```powershell
scoop install allure
```

## Linux

```bash
curl -o allure.tgz -L \
https://github.com/allure-framework/allure2/releases/download/2.27.0/allure-2.27.0.tgz

tar -zxvf allure.tgz -C /opt

sudo ln -s /opt/allure-2.27.0/bin/allure /usr/bin/allure
```

Verify installation:

```bash
allure --version
```

---

# Verify Project Setup

```bash
npx playwright --version

allure --version

npx tsc --noEmit
```

---

# Running Tests

## Run all tests

```bash
npm test
```

---

## Run by browser

```bash
npm run test:chromium

npm run test:firefox

npm run test:webkit
```

---

## Run mobile tests

```bash
npm run test:mobile
```

---

## Run specific suites

### Happy path

```bash
npm run test:happy
```

### Negative tests

```bash
npm run test:negative
```

### Edge cases

```bash
npm run test:edge
```

---

## Run in headed mode

```bash
npm run test:headed
```

---

## Run with Playwright UI

```bash
npm run test:ui
```

---

## Debug tests

```bash
npm run test:debug
```

Or:

```bash
npx playwright test --debug tests/happy-path/registration.spec.ts
```

---

# Run Tests with Tags

```bash
npx playwright test --grep "BUG_001"

npx playwright test --grep "P1"

npx playwright test --grep "regression"
```

---

# Run Against Another Environment

```bash
BASE_URL=https://staging.qa-assessment.pages.dev npm test
```

---

# Reports

# Playwright HTML Report

Generate and open:

```bash
npm test

npm run report
```

Default URL:

```txt
http://localhost:9323
```

---

# Allure Report

## Generate report

```bash
npm run allure:generate
```

## Open report

```bash
npm run allure:open
```

---

## Start Allure live server

```bash
npm run allure:serve
```

---

# View Playwright Trace

```bash
npx playwright show-trace test-results/path/to/trace.zip
```

---

# Project Structure

```txt
qa-assessment-automation/
│
├── .github/
│   └── workflows/
│       └── playwright.yml
│
├── pages/
│   ├── BasePage.ts
│   └── RegisterPage.ts
│
├── tests/
│   ├── happy-path/
│   │   └── registration.spec.ts
│   │
│   ├── negative/
│   │   └── validation.spec.ts
│   │
│   └── edge-cases/
│       └── boundary.spec.ts
│
├── fixtures/
│   └── testData.ts
│
├── utils/
│   └── helpers.ts
│
├── allure-results/
├── allure-report/
├── playwright-report/
├── test-results/
│
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

# CI/CD Pipeline & Reporting Automatisé

GitHub Actions s'exécute automatiquement :

- **À chaque push** sur `main` et `develop`
- **À chaque Pull Request** ciblant `main`
- **Planification quotidienne automatique (Cron) : 3 fois par jour à 7h00, 9h00 et 13h00** (Heure CET / Paris)
- **Déclenchement manuel (`workflow_dispatch`)** avec option d'envoi d'email et sélection de destinataire

---

# Pipeline Jobs & Fonctionnalités

| Job / Étape | Description |
|-------------|-------------|
| **Matrice de Tests (Chromium, Firefox, WebKit, Mobile)** | Exécution parallèle avec cache Playwright et installation ciblée par navigateur |
| **Allure Report** | Consolidation des résultats et publication du rapport interactif sur GitHub Pages |
| **Rapport Exécutif PDF** | Génération automatisée via Playwright d'un PDF A4 synthétique avec KPIs, graphiques et liste des anomalies |
| **Notification & Envoi de Rapport** | Envoi automatique par email contenant le rapport exécutif en pièce jointe PDF et le lien vers le rapport HTML interactif |
| **GitHub Step Summary** | Tableau de bord avec statut, métriques et liens directs vers les artefacts |

---

# Déploiement & Consultation des Rapports

Les rapports sont automatiquement publiés et accessibles en ligne :

- **Rapport HTML Interactif Allure :** `https://etienne201.github.io/qa-assessment-automation/`
- **Rapport Exécutif PDF direct :** `https://etienne201.github.io/qa-assessment-automation/qa-test-report.pdf`
- **Résumé HTML direct :** `https://etienne201.github.io/qa-assessment-automation/executive-summary.html`

---

# Configuration des Secrets pour l'envoi d'Email

Pour activer l'envoi automatique du rapport PDF et du lien HTML par email aux heures prévues (7h, 9h, 13h), configurez les secrets suivants dans votre dépôt GitHub (*Settings > Secrets and variables > Actions*) :

| Secret | Description | Exemple |
|---|---|---|
| `SMTP_SERVER` | Hôte SMTP de votre fournisseur d'email | `smtp.gmail.com` ou `smtp.sendgrid.net` |
| `SMTP_PORT` | Port SMTP (SSL: 465, TLS/STARTTLS: 587) | `465` ou `587` |
| `SMTP_USERNAME` | Nom d'utilisateur ou adresse email expéditeur | `mon.adresse@gmail.com` |
| `SMTP_PASSWORD` | Mot de passe applicatif SMTP | `abcd efgh ijkl mnop` |
| `NOTIFICATION_EMAIL` | Adresse(s) email du/des destinataire(s) | `qa-team@entreprise.com` |

---

# Allure Annotations

| Annotation | Purpose |
|------|------|
| `allure.epic()` | Main feature group |
| `allure.feature()` | Feature module |
| `allure.story()` | User story |
| `allure.severity()` | Test priority |
| `allure.tag()` | Tags and filters |
| `allure.owner()` | Test owner |
| `allure.description()` | Detailed description |
| `allure.link()` | Link to issue |
| `allure.step()` | Named execution step |

---

# Known Issues

| Issue | Description | Status |
|------|-------------|--------|
| BUG_001 | LinkedIn field incorrectly required | Open |
| BUG_002 | DOB format validation issue | Open |
| BUG_008 | Missing real API call | Open |
| WebKit timing | WebKit instability on CI | Mitigated with retries |

---

# Cleanup

Remove generated files:

```bash
npm run clean
```

---

# Commit Convention

This project follows Conventional Commits.

Examples:

```bash
feat(automation): add phone number validation tests

fix(pom): update selectors after DOM inspection

test(regression): add BUG_001 validation

ci: add Allure GitHub Pages deployment

docs: improve README installation guide
```

---

# Best Practices Used

- Page Object Model (POM)
- Centralized test data
- Cross-browser execution
- Retry strategy for CI
- Trace collection on failures
- Screenshots/videos on failure
- Parallel execution
- Allure reporting
- GitHub Actions automation

---

# Author

### Poutchoko Emako Etienne

QA Automation Engineer
Playwright • TypeScript • CI/CD • Allure