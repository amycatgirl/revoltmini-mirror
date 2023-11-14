import { startSocket, togglePage } from "./app.js";
import { CLIENT_FRIENDLY_NAME, TOKEN_LOCATION } from "./globals.js";
import { setToken, storage } from "./index.js";

/**
  @typedef {{success: string, _id: string, user_id: string, token: string, name: string, subscription: Object}} SessionResponse
*/

/**
  @param {string} token
  @param {"persistent" | "temp"} location

  Save token as base64 encoded value
*/
function saveToken(token, location) {
  const encoded = encodeURIComponent(btoa(token));

  switch (location) {
    default:
    case "persistent":
      storage.setItem("rvlt:token", encoded);
      break;
    case "temp":
      document.cookie = `${TOKEN_LOCATION}=${encoded};path=/;SameSite=Lax`;
      break;
  }
}

/**
  @async
  @param {[string, string]} values
  @param {boolean} usePersistent
  @returns {Promise<string>}
*/
async function login(values, usePersistent) {
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
        saveToken(parsed.token, usePersistent ? "persistent" : "temp");
        storage.setItem("rvlt:session", parsed._id);
        togglePage();

        return parsed.token;
      }
    }
  } catch (e) {
    alert("Login Failed");
    console.error("debug: failed to log in", e.stack);
  }
}
/**
  @async
  @param {string} token - MFA Token
  @param {string} ticket - MFA Ticket
  @param {boolean} usePersistent

  @returns {Promise<void>}
*/
async function handleMFA(token, ticket, usePersistent) {
  try {
    /** @type {SessionResponse} */
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
      saveToken(response.token, usePersistent ? "persistent" : "temp");

      storage.setItem("rvlt:session", response._id);
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
