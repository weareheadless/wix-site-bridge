class WhPropertyCard extends HTMLElement {
  static get observedAttributes() {
    return ["title", "href"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const title = this.getAttribute("title") ?? "Property";
    const href = this.getAttribute("href") ?? "#";
    this.innerHTML = `<a href="${this.escapeAttribute(href)}"><strong>${this.escapeText(title)}</strong></a>`;
  }

  escapeText(value) {
    return value.replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  escapeAttribute(value) {
    return this.escapeText(value);
  }
}

if (!customElements.get("wh-property-card")) {
  customElements.define("wh-property-card", WhPropertyCard);
}
