# Security Findings & Remediation

## Finding ID: VULN-001 (BOLA)
- **Severity**: Critical
- **Vulnerability Type**: Broken Object Level Authorization (BOLA)
- **CWE Mapping**: CWE-285 (Improper Authorization)
- **OWASP Mapping**: API1:2023 Broken Object Level Authorization
- **Endpoint**: `PUT /api/users/:id`
- **Description**: The endpoint does not verify if the requested `id` belongs to the authenticated user.
- **Exploitation Scenario**: An attacker changes the ID in the URL to modify another user's profile.
- **Impact**: Account takeover and unauthorized data modification.
- **Remediation**: Implement strict RBAC and ownership checks comparing the JWT subject to the requested ID.
- **Verification Steps**: Attempt to modify a target user profile using an unauthorized user's token. Ensure it returns `403 Forbidden`.

## Finding ID: VULN-002 (Hardcoded Secret)
- **Severity**: High
- **Vulnerability Type**: Hardcoded Cryptographic Key
- **CWE Mapping**: CWE-798 (Use of Hard-coded Credentials)
- **OWASP Mapping**: API3:2023 Broken Object Property Level Authorization (or Misconfiguration)
- **File Path**: `src/config/auth.js`
- **Description**: The JWT signing secret is hardcoded directly in the source code.
- **Exploitation Scenario**: If the code is leaked or reverse-engineered, attackers can mint valid admin JWT tokens.
- **Impact**: Full system compromise.
- **Remediation**: Use environment variables (`process.env.JWT_SECRET`) and secure secret management (AWS Secrets Manager, HashiCorp Vault).
- **Verification Steps**: Search the codebase for secrets using `gitleaks`.

*(More detailed findings can be found in the `Vulnerability Test Results/findings.xlsx` Excel document).*
