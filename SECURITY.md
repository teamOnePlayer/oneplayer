# Security Policy

## Supported Versions

The following versions of OnePlayer are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in OnePlayer, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Send an email with details to the maintainers
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Response Time:** We aim to respond within 48 hours
- **Updates:** You'll receive updates on the progress every 7 days
- **Resolution:** Critical vulnerabilities will be patched within 7 days
- **Credit:** If you wish, we'll credit you in the release notes

### After Reporting

| Outcome | What Happens |
|---------|--------------|
| Accepted | We'll work on a fix and release a security patch |
| Declined | We'll explain why it's not considered a vulnerability |
| Duplicate | We'll let you know it's already being addressed |

## Security Best Practices

When using OnePlayer:

- Keep your dependencies updated (`npm update`)
- Never expose your Discord token or Lavalink password
- Use environment variables for sensitive data
- Validate user input before passing to OnePlayer methods
- Keep your Lavalink server secured and up to date

## Scope

This security policy covers:

- OnePlayer core library (`oneplayer` npm package)
- Example code in the repository

Out of scope:

- Third-party plugins
- Lavalink server vulnerabilities
- Discord.js vulnerabilities

---

Thank you for helping keep OnePlayer secure! 🔒