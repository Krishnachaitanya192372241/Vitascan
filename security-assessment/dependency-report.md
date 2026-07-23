# Dependency & Supply Chain Scan Report

## Scanners Executed
- Semgrep (SAST)
- Trivy (Container & Dependency)
- Gitleaks (Secrets)
- OWASP Dependency Check (SCA)

## Trivy & SCA Findings
- **High Risk**: `jsonwebtoken < 9.0.0` has a known signature validation bypass vulnerability. Update to `jsonwebtoken@^9.0.0`.
- **Medium Risk**: `express-rate-limit < 6.0.0` suffers from IP spoofing issues. Update to `express-rate-limit@^6.0.0`.

## Gitleaks Findings
- Detected 1 hardcoded JWT secret in `config/auth.js`.

## Semgrep Findings
- Rule `javascript.express.security.audit.express-check-csurf`: CSRF protection is missing for state-changing endpoints.
