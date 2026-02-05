# 🩺 Troubleshooting: Discord Notification Workflow Issues

**Date**: 2026-02-05 **Issues**: Discord notifications failing for Cloudflare
Pages deployments **Resolution**: Switched to Python-based secret sanitization
and multi-auth support.

## 🔴 Core Issues Identified

### 1. YAML & Shell Syntax Errors

- **Problem**: Complex polling logic and JSON generation using `curl`, `jq`, and
  bash Heredocs (`<<EOF`) in a YAML file led to escaping issues and syntax
  errors.
- **Example**: `COMMIT_SHA: command not found` error due to improper variable
  expansion in shell scripts.

### 2. Whitespace in GitHub Secrets

- **Problem**: Invisible spaces or newlines often sneak in when copying and
  pasting secrets (API Tokens, Account IDs) into GitHub.
- **Impact**: API calls returned `403 Forbidden` or `Invalid API Token` because
  the headers were literally `Bearer [TOKEN_WITH_SPACE]`.

### 3. Inconsistent Secret Names

- **Problem**: Discrepancy between the variable names in the `.yml` file and the
  actual secrets stored in GitHub (e.g., `DISCORD_WEBHOOK` vs
  `DISCORD_WEBHOOK_URL`).

### 4. API Token Permission Scope

- **Problem**: The diagnostic step (`/user/tokens/verify`) sometimes required
  different permissions than the deployment polling step.
- **Impact**: The workflow might report a "fail" even if the token was actually
  capable of checking deployment status.

## 🟢 Solutions Applied

### 1. Robust Sanitization (Python)

Instead of relying on fragile bash `xargs`, we implemented a **Python** script
at the start of the workflow:

```python
def clean(val):
    return val.strip() if val else ""
```

This ensures that any invisible characters are 100% removed before being used in
API calls.

### 2. Python for JSON Payloads

Generating Discord JSON payloads with complex metadata (Commit SHA, Author,
URLs) in bash is dangerous. We moved this to Python's `json.dumps()` for safety.

### 3. Flexible Authentication (Multi-Auth)

Added support for two Cloudflare auth methods to guarantee success:

- **API Token**: Uses `Authorization: Bearer <TOKEN>`.
- **Global API Key**: Uses `X-Auth-Email` and `X-Auth-Key` (Fallback if the
  specific token permissions are hard to configure).

### 4. Advanced Diagnostics

Added a step to log the **length** and **prefix/suffix** of the token (masked)
to help the user identify:

- If they accidentally included "Bearer " in the secret.
- If the token looks too short/long.

## 📝 Lessons Learned

- **Don't use Bash for complex logic in YAML**: If a script exceeds 5 lines or
  needs JSON, use Python.
- **Sanitize everything**: Never trust a variable coming directly from
  `secrets.*`. Always strip it first.
- **Provide fallback paths**: When API permissions are tricky, allowing a Global
  Key fallback saves hours of debugging.
