import { LitElement, html, css } from "lit";

/**
 * Component used to display servers in the sidebar.
 */
class ServerIcon extends LitElement {
  static properties = {
    fullName: { type: String, attribute: "server-name" },
    isSelf: { type: Boolean, reflect: true, attribute: "self" }
  }

  static styles = css`
    div {
      display: flex;
      font-size: 15pt;
      background-color: gray;
      border-radius: 5px;
      align-items: center;
      justify-content: center;
      width: 4rem;
      height: 4rem;
    }

    :host([self]) div {
      background-color: var(--accent);
      color: var(--fg);

      font-weight: 700;
      flex-shrink: 0;
    }
  `

  constructor() {
    super();

    this.fullName = "Server Name";
    this.isSelf = false;
  }

  render() {
    return html`
        <div>
          <span>${this._getTruncatedName()}</span>
        </div>
      `
  }

  _getTruncatedName() {
    return this.fullName
      .split(" ")
      .map(st => st[0])
      .filter(el => typeof el !== "undefined")
      .join("")
      .substring(0, 3)
  }
}

export { ServerIcon }
