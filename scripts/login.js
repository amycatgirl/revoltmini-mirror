import { startSocket, togglePage } from "./app.js";
import { CLIENT_FRIENDLY_NAME, TOKEN_LOCATION } from "./globals.js";
import { setToken } from "./index.js";

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

      if (parsed.result === "MFA") {
        // Create a dialog that requires mfa
        const modal = document.createElement("dialog", { is: "custom-modal" });
        modal.setAttribute("title", "2 Factor Authentication");
        modal.setAttribute(
          "description",
          "Your account has 2FA set up. To log in, use the token provided by your authenticator app.",
        );
        modal.setAttribute("isMFA", "yes");
        modal.setAttribute("ticket", parsed.ticket);
        document.body.append(modal);
      } else {
        /** @type {string} */
        const encoded = encodeURIComponent(btoa(parsed.token));
        // store token in cookie
        document.cookie = `${TOKEN_LOCATION}=${encoded};path=/;SameSite=Lax`;

        togglePage();

        return parsed.token;
      }
    }
  } catch (e) {
    alert("Login Failed");
    console.error("debug: failed to log in", e.stack);
  }
}

async function handleMFA(token, ticket) {
  try {
    const response = await fetch("https://api.revolt.chat/auth/session/login", {
      method: "POST",
      body: JSON.stringify({
        mfa_ticket: ticket,
        mfa_response: {
          totp_code: token,
        },
        friendly_name: CLIENT_FRIENDLY_NAME,
      }),
    }).then(async (res) => await res.json());

    if (response.result !== "MFA") {
      /** @type {string} */
      const encoded = encodeURIComponent(btoa(response.token));
      // store token in cookie
      document.cookie = `${TOKEN_LOCATION}=${encoded};path=/;SameSite=Lax`;

      setToken(response.token);

      togglePage();

      startSocket();

      return;
    }
  } catch (e) {
    alert("die");
    console.error("debug: failed to login with 2fa", e.stack);
  }
}

export { login, handleMFA };
