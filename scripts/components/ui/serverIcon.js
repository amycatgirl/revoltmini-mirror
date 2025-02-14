import { LitElement, html, css } from "lit";

/**
 * Component used to display servers in the sidebar.
 */
class ServerIcon extends LitElement {
  static properties = {
    fullName: { type: String, attribute: "server-name" },
    isSelf: { type: Boolean, reflect: true, attribute: "self" },
    server_id: { type: String, reflect: true, attribute: "server-id" }
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
        background-image: linear-gradient(to right, var(--header-bg), var(--header-bg), color-mix(in lab, var(--header-bg), white 50%), color-mix(in lab, var(--header-bg), white 50%), var(--header-bg), var(--header-bg));
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
    this.server_id = "";

    this.addEventListener("click", () => {
      const sd = document.getElementById("info");

      if (this.isSelf) {
        sd.dispatchEvent(new CustomEvent("navHome"))
      } else {
        sd.dispatchEvent(new CustomEvent("sync", {
          detail: {
            name: this.fullName,
            id: this.server_id
          }
        }))

      }
    })
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
      .substring(0, 2)
  }
}

export { ServerIcon }
