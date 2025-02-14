import { LitElement, html, css } from "lit";

export class ServerList extends LitElement {
  static styles = css`
    :host {
      width: 100%;
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: center;

      overflow-y: scroll !important;
      scrollbar-width: none;
      scroll-behavior: smooth;
      gap: 1rem;
    }
  `;
  constructor() {
    super();

    this.addEventListener("recieveServers", (e) => this.#recieveServers(e.detail));
  }

  /**
  * @private
  * @param {[string, object]} entries - Server Entries (unordered)
  */
  #recieveServers(entries) {
    const elements = [];

    for (const [id, server] of entries) {
      const serverIcon = document.createElement("server-icon");

      serverIcon.setAttribute("server-id", id);
      serverIcon.setAttribute("server-name", server.name);
      elements.push(serverIcon);
    }

    this.renderRoot.replaceChildren(...elements);
  }

  render() {
    return html`
            <server-icon loading></server-icon>
            <server-icon loading></server-icon>
            <server-icon loading></server-icon>
            <server-icon loading></server-icon>
      `;
  }
}
