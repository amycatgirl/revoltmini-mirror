import { ContextProvider } from "@lit/context";
import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { AppContext } from "../contexts/AppState";

const IntroScreen = html`
  <div class="intro">
    <h1>Welcome to RevoltMini!</h1>
    <p>Use the dropdowns to navigate across servers</p>
    <p>Push notifications are available for mobile/desktop devices, but it needs your permission to enable them.
      Click the button below to allow RevoltMini to send notifications</p>
    <button id="push"><material-symbols name="notifications"></material-symbols> Request Notification
      Permission</button>
  </div>
`

export class MessageView extends LitElement {

  #handleNavigation(route, data) {
    console.log(`debug/router: performing navigation from ${this._route} to ${route}`)
    console.log(`debug/router: With arguments`, data)

    this._route = route;

    switch (route) {
      case "app/channel":
        this._messages = data.messages.toReversed();
        this.current_channel = data.id
        break;
      case "internal/home":
        this._messages = [];
        this.current_channel = "";
        break;
      default:
        break;
    }
  }

  constructor() {
    super();

    this.current_channel = "";
    this._route = "internal/home"
    this._messages = [];

    this.addEventListener("message", ev => {
      this._messages = [...this._messages, ev.detail.msg];
    })

    this.addEventListener("navigate", async ev => {
      this.#handleNavigation(ev.detail.route, ev.detail.args);

    })
  }
  static properties = {
    _route: { type: String, state: true },
    _messages: { type: Array, hasChanged: (_a, _b) => true }
  }

  render() {
    let screen;

    switch (this._route) {
      case "internal/home":
        screen = IntroScreen;
        break;
      case "app/channel":
        screen = html`
            ${repeat(this._messages, el => el._id, el => {
          const renderer = document.createElement("lit-message-renderer");
          renderer.setAttribute("message-id", el._id);
          return renderer
        })}
          `
        break;
      default:
        screen = html`what`
        break;
    }

    return html`${screen}`
  }
}
