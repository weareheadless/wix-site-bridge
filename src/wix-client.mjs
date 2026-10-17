const API = "https://www.wixapis.com/embeds/v1/custom-embeds";
const TOKEN_ENDPOINT = "https://www.wixapis.com/oauth2/token";

export class WixRequestError extends Error {
  constructor(status, message = "Wix request failed") {
    super(message);
    this.name = "WixRequestError";
    this.status = status;
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
    if (!response.ok) throw new WixRequestError(response.status, "Wix OAuth token request failed; response details were omitted.");
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
    if (!response.ok) throw new WixRequestError(response.status);
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

  async updateHtml(embed, html) {
    const result = await this.request(`${API}/${encodeURIComponent(embed.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        customEmbed: {
          id: embed.id,
          revision: String(embed.revision),
          embedData: { category: embed.embedData.category, html }
        }
      })
    });
    return result.customEmbed;
  }
}
