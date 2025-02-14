import { LitElement, html, css } from "lit";
import { token } from "../../index.js";

/**
 * Primitive type for sidebar entries
 * @typedef {Object} SidebarEntry
 * @prop {string} name - Name of the entry
 * @prop {() => void} callback - Function to call when the entry is clicked
 * @prop {string} [icon] - Icon to use (Optional)
 * @prop {string} [id] - Optional identifier. If empty, Name will be used.
 */

export class SecondarySidebar extends LitElement {
  static styles = css`
		:host {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      height: 100%;

      align-items: normal;
      width: 100%;
		}

		header {
      margin-left: 10px;
		}

		header h1 {
		  margin-bottom: 0;
		}

		.options {
      list-style-type: none;
      padding: 0 5px;

      display: flex;
      flex-direction: column;

      gap: 1rem;

      overflow-y: scroll;
      scrollbar-width: none;
		}

		.options li {
      display: inline-flex;
      align-items: center;
      gap: 1rem;

      border-radius: 10px;
      padding: 5px;

      background-color: var(--header-bg);
      color: var(--secondary-fg);
    }

		.options :is(li) material-symbols {
      margin-left: 10px;
		}
	`;

  constructor() {
    super();

    this.addEventListener("sync", async ev => {
      console.log(ev.detail);
      const channels = await ev.currentTarget.accuireChannels(ev.detail.id)
      this.setSidebarTitle(ev.detail.name);
      this.generateOptions(channels.map((ch) => {
        return {
          name: ch.name,
          icon: "tag",
          id: ch.id,
          callback: () => console.log(`NAVIGATE: ${ch.name} (${ch.id})`)
        }
      }))

    });

    this._title = "Home";
    this.generateOptions([
      {
        name: "Log Out",
        icon: "logout",
        id: "logout",
        callback: () => console.log("TODO)) Perform logout")
      }
    ]);
  }

  static properties = {
    _title: { state: true },
    options: {},
  }

  /**
  * Render a specific set of entries.
  * @param {SidebarEntry[]} items - Items to render
  * @returns {HTMLUListElement}
  */
  generateOptions(items) {
    const elements = [];
    for (const entry of items) {
      const children = [];
      const list_item = document.createElement("li");
      list_item.id = entry.id ?? entry.name.toLowerCase();
      list_item.onclick = entry.callback;
      if (entry.icon) {
        const item_icon = document.createElement("material-symbols");
        item_icon.name = entry.icon;
        children.push(item_icon);
      }

      const item_title = document.createElement("p");
      item_title.innerText = entry.name;
      children.push(item_title);

      list_item.replaceChildren(...children);
      elements.push(list_item);
    }

    const list = document.createElement("ul")
    list.classList.add("options")
    list.replaceChildren(...elements);

    this.options = list
  }

  setSidebarTitle(new_title) {
    this._title = new_title;
  }

  async accuireChannels(server_id) {
    console.log(token)
    const { channels } = await fetch(
      `https://api.revolt.chat/servers/${server_id}?include_channels=true`,
      { headers: { "x-session-token": token } }
    ).then(async (res) => await res.json())

    console.log(channels)

    return channels
  }

  render() {
    return html`
          <header>
            <h1>${this._title}</h1>
          </header>
          ${this.options}
		`;
  }
}
