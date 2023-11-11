import { togglePage } from "./app.js";
import { CLIENT_FRIENDLY_NAME, TOKEN_LOCATION } from "./globals.js";

/**
  @typedef {{success: string, _id: string, user_id: string, token: string, name: string, subscription: Object}} SessionResponse
*/

/**
  @async
  @param {[string, string]} values
  @returns {Promise<string>}
*/
async function login(values) {
  try {
    const response = await fetch("https://api.revolt.chat/auth/session/login", {
      method: "POST",
      body: JSON.stringify({
        email: values[0],
        password: values[1],
        friendly_name: CLIENT_FRIENDLY_NAME,
      }),
    });

    if (response.ok) {
      /** @type {SessionResponse}*/
      const parsed = await response.json();

      /** @type {string} */
      const encoded = encodeURIComponent(btoa(parsed.token));
      // store token in cookie
      document.cookie = `${TOKEN_LOCATION}=${encoded};path=/;SameSite=Lax`;

      togglePage();

      return parsed.token;
    }
  } catch (e) {
    alert("Login Failed", e);
  }
}

export { login };
