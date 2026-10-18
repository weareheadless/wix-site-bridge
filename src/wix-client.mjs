const API = "https://www.wixapis.com/embeds/v1/custom-embeds";
const TOKEN_ENDPOINT = "https://www.wixapis.com/oauth2/token";

function validationHint(violation) {
  const constraint = [violation?.violatedRule, violation?.ruleName, violation?.description, violation?.message]
    .filter((value) => typeof value === "string")
    .join(" ");
  if (/length|size|too\s+long|exceed|max(?:imum)?|limit/i.test(constraint)) return "SIZE_OR_LENGTH_LIMIT";
  if (/required|missing/i.test(constraint)) return "REQUIRED_VALUE";
  if (/invalid|unsupported|malformed|not\s+allowed/i.test(constraint)) return "INVALID_VALUE";
  return null;
}

function detailedValidationHints(violation) {
  const hints = [];
  const rule = [violation?.violatedRule, violation?.ruleName]
    .find((value) => typeof value === "string" && /^[A-Za-z0-9_.-]{1,50}$/.test(value));
  if (rule) hints.push(`RULE_${rule.replace(/[^A-Za-z0-9_.-]/g, "_").toUpperCase()}`);
  const description = [violation?.description, violation?.message]
    .filter((value) => typeof value === "string")
    .join(" ");
  const statedLimit = description.match(/(?:maximum|max(?:imum)?\s+(?:length|size)|limit(?:\s+of)?)\D{0,24}(\d{1,7})\s*(kb|mb|bytes|characters|chars)?/i);
  if (statedLimit) hints.push(`STATED_LIMIT_${statedLimit[1]}${statedLimit[2] ? `_${statedLimit[2].toUpperCase()}` : ""}`);
  const collectLimits = (data, prefix = "", depth = 0) => {
    if (!data || typeof data !== "object" || depth > 3) return;
    for (const [key, value] of Object.entries(data)) {
      if (!/^[A-Za-z0-9_.-]{1,40}$/.test(key)) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (/(?:max|limit|length|size|bytes|characters)/i.test(key) && Number.isSafeInteger(value) && value >= 0 && value <= 10_000_000) {
        hints.push(`META_${path.toUpperCase()}_${value}`);
      } else if (typeof value === "object") collectLimits(value, path, depth + 1);
    }
  };
  collectLimits(violation?.data);
  return hints;
}

export class WixRequestError extends Error {
  constructor(status, code = null, fields = [], hints = [], message = "Wix request failed") {
    super(message);
    this.name = "WixRequestError";
    this.status = status;
    this.code = typeof code === "string" && /^[A-Z0-9_-]{1,60}$/.test(code) ? code : null;
    this.fields = Array.isArray(fields) ? fields.filter((field) => typeof field === "string" && /^[A-Za-z0-9_.$\[\]-]{1,100}$/.test(field)).slice(0, 8) : [];
    this.hints = Array.isArray(hints) ? [...new Set(hints.filter((hint) => typeof hint === "string" && /^(?:SIZE_OR_LENGTH_LIMIT|REQUIRED_VALUE|INVALID_VALUE|RULE_[A-Z0-9_.-]{1,50}|STATED_LIMIT_\d{1,7}(?:_KB|_MB|_BYTES|_CHARACTERS|_CHARS)?|LIMIT_\d{1,8}|META_[A-Z0-9_.-]{1,60}_\d{1,8})$/.test(hint)))].slice(0, 8) : [];
  }
}

export class WixRevisionConflictError extends WixRequestError {
  constructor(status = 409) {
    super(status, "Wix Custom Embed revision changed.");
    this.name = "WixRevisionConflictError";
  }
}

export class WixAppTokenProvider {
  constructor({ appId, appSecret, instanceId, fetchImpl = fetch }) {
    this.appId = appId;
    this.appSecret = appSecret;
    this.instanceId = instanceId;
    this.fetchImpl = fetchImpl;
    this.cached = null;
  }

  static fromEnv(env = process.env, fetchImpl = fetch) {
    return new WixAppTokenProvider({
      appId: env.WIX_APP_ID,
      appSecret: env.WIX_APP_SECRET,
      instanceId: env.WIX_APP_INSTANCE_ID,
      fetchImpl
    });
  }

  async getToken() {
    if (!this.appId || !this.appSecret || !this.instanceId) {
      throw new Error("Custom Embeds require WIX_APP_ID, WIX_APP_SECRET, and WIX_APP_INSTANCE_ID for a Wix app with Manage Custom Embeds permission.");
    }
    if (this.cached && this.cached.expiresAt > Date.now() + 60_000) return this.cached.token;
    let response;
    try {
      response = await this.fetchImpl(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: this.appId,
          client_secret: this.appSecret,
          instance_id: this.instanceId
        })
      });
    } catch {
      throw new Error("Could not reach the Wix OAuth token endpoint.");
    }
    if (!response.ok) throw new WixRequestError(response.status, null, [], [], "Wix OAuth token request failed; response details were omitted.");
    const data = await response.json();
    if (typeof data.access_token !== "string" || !data.access_token) throw new Error("Wix OAuth response did not include an access token.");
    const lifetimeMs = Number(data.expires_in ?? 14_400) * 1000;
    this.cached = { token: data.access_token, expiresAt: Date.now() + lifetimeMs };
    return this.cached.token;
  }
}

export class WixCustomEmbedsClient {
  constructor({ siteId, tokenProvider, fetchImpl = fetch }) {
    this.siteId = siteId;
    this.tokenProvider = tokenProvider;
    this.fetchImpl = fetchImpl;
  }

  async request(url, init = {}) {
    const token = await this.tokenProvider.getToken();
    let response;
    try {
      response = await this.fetchImpl(url, {
        ...init,
        headers: {
          authorization: token,
          "wix-site-id": this.siteId,
          ...(init.body ? { "content-type": "application/json" } : {}),
          ...init.headers
        }
      });
    } catch {
      throw new Error("Could not reach the Wix Custom Embeds API.");
    }
    if (response.status === 409 || response.status === 412) throw new WixRevisionConflictError(response.status);
    if (!response.ok) {
      let code = null;
      const fields = [];
      const hints = [];
      try {
        const errorBody = await response.json();
        code = errorBody.code ?? errorBody.errorCode ?? errorBody.details?.applicationError?.code ?? null;
        const violations = [
          errorBody.fieldViolations,
          errorBody.validationError?.fieldViolations,
          errorBody.details?.fieldViolations,
          errorBody.details?.validationError?.fieldViolations,
          errorBody.details?.validationError?.violations,
          errorBody.data?.violations
        ].flat().filter(Boolean);
        for (const violation of violations) {
          fields.push(violation.field ?? violation.path ?? violation.fieldName ?? violation.fieldPath);
          const hint = validationHint(violation);
          if (hint) hints.push(hint);
          hints.push(...detailedValidationHints(violation));
        }
      } catch {
        // Wix error bodies aren't consistent; only a safe, generic status will be reported.
      }
      throw new WixRequestError(response.status, code, fields, hints);
    }
    if (response.status === 204) return {};
    try {
      return await response.json();
    } catch {
      throw new Error("Wix returned an unreadable response.");
    }
  }

  async listAll() {
    const items = [];
    let cursor;
    do {
      const url = new URL(API);
      url.searchParams.set("paging.limit", "100");
      if (cursor) url.searchParams.set("paging.cursor", cursor);
      const result = await this.request(url);
      items.push(...(result.customEmbeds ?? []));
      const metadata = result.pagingMetadata ?? {};
      cursor = metadata.hasNext ? metadata.cursor : null;
      if (metadata.hasNext && !cursor) throw new Error("Wix returned a next-page marker without a cursor.");
    } while (cursor);
    return items;
  }

  async get(id) {
    const result = await this.request(`${API}/${encodeURIComponent(id)}`);
    return result.customEmbed;
  }

  async updateHtml(embed, html, category = embed.embedData.category) {
    const result = await this.request(`${API}/${encodeURIComponent(embed.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        customEmbed: {
          id: embed.id,
          revision: String(embed.revision),
          embedData: { category, html }
        }
      })
    });
    return result.customEmbed;
  }

  async create({ name, position, category, html, enabled = true, loadOnce = false, domain }) {
    const customEmbed = {
      name,
      enabled,
      loadOnce,
      position,
      embedData: { category, html }
    };
    if (domain) customEmbed.domain = domain;
    const result = await this.request(API, {
      method: "POST",
      body: JSON.stringify({ customEmbed })
    });
    return result.customEmbed;
  }
}
