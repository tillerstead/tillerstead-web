# Security Policy

**Tillerstead LLC**

---

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, do **NOT** open
a public issue. Instead:

1. Email security concerns to the repository owner via GitHub profile contact.
2. Include: description of the vulnerability, steps to reproduce, potential
   impact assessment.
3. Allow 72 hours for initial acknowledgment.

## Sensitive Files — NEVER Commit

The following files contain sensitive information and must NEVER be committed:

### Environment Variables

- `.env`
- `.env.local`
- `.env.production`
- `.env.staging`
- Any file containing API keys, tokens, or secrets

### Database Files

- `*.db`, `*.sqlite`, `*.sqlite3`
- `instance/*.db`
- `dump.rdb`

### Certificates and Keys

- `*.keystore`, `*.jks`, `*.p12`
- `*.pem`, `*.key`, `*.cer`
- `*.mobileprovision`

### Credentials

- `credentials.json`, `token.json`
- `service-account-*.json`
- SSH private keys (`id_rsa`, `id_ed25519`)

## Branch Protection Requirements

- Default branch must require pull request reviews.
- Force-push to default branch is prohibited.
- Status checks must pass before merging.
- Commit signing is recommended for all contributors.

## Dependency Management

- Run `npm audit` / `pip audit` / `bundle audit` regularly.
- Do not introduce dependencies with known CVEs.
- Pin dependency versions in production configurations.

## Deployment Security

- All deployment credentials must be stored in GitHub Secrets or equivalent
  secret managers.
- No credentials in code, comments, commit messages, or CI logs.
- Deployment targets must use HTTPS/TLS.

## Incident Response

1. Immediately disable compromised credentials.
2. Audit recent access and deployment logs.
3. Notify the Manager within 24 hours.
4. Document the incident and remediation steps.

---

© 2026 Tillerstead LLC.
