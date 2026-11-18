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

  async updateHtml(embed, html, category = embed.embedData.category, loadOnce = embed.loadOnce) {
    const result = await this.request(`${API}/${encodeURIComponent(embed.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        customEmbed: {
          id: embed.id,
          revision: String(embed.revision),
          enabled: embed.enabled,
          loadOnce,
          position: embed.position,
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

const SEO_API = "https://www.wixapis.com/promote/seo/v1/item-seo-tags";

function tagCanonicalHref(tag) {
  if (tag?.type !== "link") return null;
  const rel = String(tag.props?.rel ?? "");
  if (!rel.split(/\s+/).includes("canonical")) return null;
  return typeof tag.props?.href === "string" ? tag.props.href : null;
}

/** The canonical path a static page's SEO tags already carry. */
export function canonicalPath(item) {
  const tags = [
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.resolvedTags) ? item.resolvedTags.map((entry) => entry?.tag).filter(Boolean) : [])
  ];
  for (const tag of tags) {
    const href = tagCanonicalHref(tag);
    if (!href) continue;
    try {
      return new URL(href).pathname.replace(/\/+$/, "") || "/";
    } catch {
      return href.replace(/\/+$/, "") || "/";
    }
  }
  return null;
}

/**
 * Find the static page whose canonical route is exactly this path. The SEO API
 * does not return a page URL, but its resolved canonical tag does.
 */
export function pageItemForRoute(items, route) {
  const target = String(route ?? "").trim().replace(/\/+$/, "") || "/";
  const matches = (Array.isArray(items) ? items : []).filter((item) => canonicalPath(item) === target);
  if (matches.length > 1) throw new Error(`More than one static page has canonical route ${target}.`);
  return matches[0] ?? null;
}

/** Replace the title and description, keep every other tag the page owns. */
export function mergeSeoTags(tags, { title, description }) {
  const kept = (Array.isArray(tags) ? tags : []).filter((tag) => {
    if (tag?.type === "title") return false;
    if (tag?.type === "meta" && tag.props?.name === "description") return false;
    return true;
  });
  const next = [];
  if (title) next.push({ type: "title", children: title });
  if (description) next.push({ type: "meta", props: { name: "description", content: description } });
  return [...next, ...kept];
}

export function currentSeoValue(item, type, name) {
  const pick = (tag) => (type === "meta" ? tag?.props?.content : tag?.children) ?? null;
  const own = (Array.isArray(item.tags) ? item.tags : []).find(
    (tag) => tag?.type === type && (type !== "meta" || tag.props?.name === name)
  );
  if (own) return pick(own);
  const resolved = (Array.isArray(item.resolvedTags) ? item.resolvedTags : [])
    .map((entry) => entry?.tag)
    .find((tag) => tag?.type === type && (type !== "meta" || tag.props?.name === name));
  return pick(resolved);
}

/**
 * Static-page SEO settings use a site-scoped token, not the app-instance token
 * used by Custom Embeds: an API key with Manage SEO Settings, or the Wix CLI
 * session's token for this site (the bridge resolves that fallback itself).
 */
export class WixSeoClient {
  constructor({ siteId, apiKey, fetchImpl = fetch }) {
    this.siteId = siteId;
    this.apiKey = String(apiKey ?? "").trim();
    this.fetchImpl = fetchImpl;
  }

  async request(url, init = {}) {
    if (!this.apiKey) {
      throw new Error("SEO page settings require a site-scoped token: set WIX_SEO_API_KEY (Manage SEO Settings) or authenticate the Wix CLI for this site.");
    }
    let response;
    try {
      response = await this.fetchImpl(String(url), {
        ...init,
        headers: {
          authorization: this.apiKey,
          "wix-site-id": this.siteId,
          ...(init.body ? { "content-type": "application/json" } : {}),
          ...init.headers
        }
      });
    } catch {
      throw new Error("Could not reach the Wix SEO API.");
    }
    if (!response.ok) {
      let code = null;
      const fields = [];
      const hints = [];
      try {
        const body = await response.json();
        code = body.code ?? body.errorCode ?? body.details?.applicationError?.code ?? null;
        const violations = [
          body.fieldViolations,
          body.validationError?.fieldViolations,
          body.details?.fieldViolations,
          body.details?.validationError?.fieldViolations,
          body.details?.validationError?.violations,
          body.data?.violations
        ].flat().filter(Boolean);
        for (const violation of violations) {
          fields.push(violation.field ?? violation.path ?? violation.fieldName ?? violation.fieldPath);
          const hint = validationHint(violation);
          if (hint) hints.push(hint);
          hints.push(...detailedValidationHints(violation));
        }
      } catch {
        // Only a safe status is reported when Wix does not return JSON.
      }
      throw new WixRequestError(response.status, code, fields, hints, `Wix SEO request failed (HTTP ${response.status}).`);
    }
    if (response.status === 204) return {};
    try {
      return await response.json();
    } catch {
      throw new Error("Wix returned an unreadable SEO response.");
    }
  }

  async listStaticPages() {
    const items = [];
    let cursor;
    do {
      const url = new URL(`${SEO_API}/STATIC_PAGE`);
      url.searchParams.set("paging.limit", "100");
      if (cursor) url.searchParams.set("paging.cursor", cursor);
      const result = await this.request(url);
      items.push(...(Array.isArray(result.itemSeoTags) ? result.itemSeoTags : []));
      const metadata = result.pagingMetadata ?? {};
      const next = metadata.cursors?.next ?? metadata.cursor ?? null;
      cursor = metadata.hasNext ? next : null;
      if (metadata.hasNext && !cursor) throw new Error("Wix returned a next-page marker without an SEO cursor.");
    } while (cursor);
    return items;
  }

  async setItemSeoTags(item, { title, description, publish = true }) {
    if (!item?.itemId) throw new Error("A static page item with an itemId is required.");
    const tags = mergeSeoTags(item.tags, { title, description });
    return this.request(`${SEO_API}/STATIC_PAGE/${encodeURIComponent(item.itemId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        itemSeoTags: { tags },
        fieldMask: "tags",
        publish
      })
    });
  }

  /**
   * Publish the site's saved revision. Custom-code changes written through the
   * Custom Embeds API are drafts until the site is published, and a publish
   * from the connected repository can restore an older saved revision, so a
   * delivery publishes once after its writes and verifies the result.
   */
  async publishSite() {
    return this.request("https://www.wixapis.com/site-publisher/v1/site/publish", {
      method: "POST",
      body: "{}"
    });
  }
}
