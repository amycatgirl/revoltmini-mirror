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
      background-color: var(--header-bg);
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

    :host([loading]) div {
        background-image: linear-gradient(to right, gray, gray, lightgray, lightgray, gray, gray);
        background-size: calc(100% * 10);

        animation: skeleton-anim 2s cubic-bezier(0.83, 0, 0.17, 1) infinite;
    }

    @keyframes skeleton-anim {
      0% {
        background-position: left;
      }
      100% {
        background-position: right;
      }
    }
  `

  constructor() {
    super();

    this.fullName = "";
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
