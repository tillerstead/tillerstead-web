# Phase 13A — Registrar Diagnosis

**Date:** 2026-03-08  
**Status:** ROOT CAUSE IDENTIFIED

---

## Executive Finding

**xtx396.com is on SERVER HOLD at the registry level.** This single status
flag is the root cause of ALL 7 NXDOMAIN failures. No amount of DNS record
configuration will resolve these domains until the hold is lifted.

---

## RDAP Data (verified 2026-03-08)

| Field        | Value                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Domain       | xtx396.com                                                            |
| Registrar    | IONOS (IANA ID 83)                                                    |
| Registration | 2026-02-02T04:02:16Z                                                  |
| Expiration   | 2027-02-02T23:59:59Z                                                  |
| Last Changed | 2026-03-07T15:31:55Z                                                  |
| Status       | `server hold`; server transfer prohibited; client transfer prohibited |
| DNSSEC       | Not signed (delegationSigned: false)                                  |

### Nameservers (IONOS defaults — properly configured)

- ns1125.ui-dns.com
- ns1056.ui-dns.biz
- ns1124.ui-dns.org
- ns1078.ui-dns.de

---

## What "Server Hold" Means

`serverHold` is a registry-level EPP status code. When set:

- The domain is **removed from the DNS zone** at the TLD level
- Nameservers exist in the registration but are **never queried**
- All DNS lookups return **NXDOMAIN** regardless of record configuration
- This is not a registrar issue — it's at the `.icu` registry (CentralNic)

### Common Causes

1. **ICANN email verification not completed** (most likely for a 5-week-old domain)
   - ICANN requires registrants to verify their email within 15 days
   - Failure → registry places domain on serverHold
   - This is the #1 cause for new domains
2. Payment/billing dispute
3. WHOIS accuracy challenge
4. Abuse complaint

---

## Required Action (Operator)

### Step 1: Log into IONOS Account

1. Go to `https://my.ionos.com`
2. Navigate to **Domains & SSL** → **xtx396.com**
3. Look for any **verification banners** or **pending actions**

### Step 2: Check Email

1. Search inbox (including spam) for emails from:
   - `noreply@ionos.com`
   - `verification@icann.org`
   - `noreply@centralnic.com`
2. Look for subject lines containing "verify", "confirm", or "domain verification"
3. Click any verification link found

### Step 3: If No Verification Email Found

1. In IONOS dashboard → Domains → xtx396.com → Contact Information
2. Verify the email address is correct
3. Request re-send of verification email
4. Or contact IONOS support: `https://www.ionos.com/help`

### Step 4: After Verification

- The hold should be lifted within **1-24 hours**
- DNS records already configured in IONOS will begin resolving
- If IONOS has no DNS records configured yet, add the 11 records from the DNS Execution Pack

---

## Impact Assessment

| Domain                                           | Blocked By Server Hold?  |
| ------------------------------------------------ | ------------------------ |
| `xtx396.com` (apex)                              | YES                      |
| `www.xtx396.com`                                 | YES                      |
| `www.xtx396.com/apps/civics-hierarchy/`          | NO separate DNS required |
| `www.xtx396.com/apps/doj-document-library/`      | NO separate DNS required |
| `www.xtx396.com/apps/essential-goods-ledger/`    | NO separate DNS required |
| `www.xtx396.com/apps/geneva-bible-study/`        | NO separate DNS required |
| `www.xtx396.com/apps/informed-consent/`          | NO separate DNS required |
| `www.xtx396.com/apps/contractor-command-center/` | NO separate DNS required |

**Unaffected (different registrars):**

- tillerstead.com — LIVE
- devon-tyler.com — LIVE

---

## DNS Records to Configure (after hold is lifted)

If not already entered in IONOS:

### A Records (apex xtx396.com)

| Type | Host | Value           |
| ---- | ---- | --------------- |
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |

### CNAME Records

| Type  | Host | Value                   |
| ----- | ---- | ----------------------- |
| CNAME | www  | `evident-icu.pages.dev` |

The old `civics`, `library`, `ledger`, `bible`, `consent`, and `contractor`
subdomain CNAMEs should be removed. Those apps are now served as subpaths
under `www.xtx396.com`.

---

## Verification After Hold Is Lifted

```powershell
# Quick check — should return the expected hosting targets
Resolve-DnsName xtx396.com -Type A
Resolve-DnsName www.xtx396.com -Type CNAME
```

Expected: DNS answers should match the active hosting configuration, with `www` resolving toward the configured Cloudflare Pages target.
