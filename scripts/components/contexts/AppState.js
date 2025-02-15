import { createContext, ContextProvider } from "@lit/context";
import { LitElement, html } from "lit";

/**
 * @typedef {Object} Session
 * @prop {string} id - ID of the session
 * @prop {string} username - Username (+ discriminator) attached to the session
 * @prop {string} token - Token attached to this session
 * @prop {boolean} is_active - Whether this session is currently active
 * @prop {string} [display_name] - Display Name of the user
 */

/**

*/

export const CacheContext = createContext(Symbol("rvmini/cache"));
export const SessionContext = createContext(Symbol("rvmini/session"));
export const AppContext = createContext(Symbol("rvmini/internals/state"));
export const SnackbarContext = createContext(Symbol("rvmini/internals/snackbar"))

export class AppStateProvider extends LitElement {
  #session_provider = new ContextProvider(this, { context: SessionContext, initialValue: [] });
  #snackbar_provider = new ContextProvider(this, {
    context: SnackbarContext, initialValue: {
      state: "idle",
      innerText: null, // Use default value
    }
  });
  #app_provider = new ContextProvider(this, {
    context: AppContext, initialValue: {
      current_channel: "",
    }
  })

  render() {
    return html`<slot></slot>`
  }
}
