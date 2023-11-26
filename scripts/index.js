import {
  closeConnectionAndLogOut,
  requestPush,
  startSocket,
  togglePage,
} from "./app.js";
import { TOKEN_LOCATION, CLIENT_FRIENDLY_NAME, VERSION } from "./globals.js";
import { login } from "./login.js";
import { getCookie } from "./utils.js";

/** @type {HTMLInputElement} */
const email = document.querySelector("main form input[type='email']");
/** @type {HTMLInputElement} */
const password = document.querySelector("main form input[type='password']");
/** @type {HTMLInputElement}*/
const checkbox = document.querySelector("main form input[type='checkbox']");
/** @type {HTMLFormElement} */
const form = document.querySelector("main form");

/**
  @type {[string, string]}
  
  [email, password]
*/
let values = [];

/**
  @type {boolean}
*/
let usePersistentSession = true;

/** @type {string} */
let token = "";

/** @type {Storage} */
const storage = window.localStorage;

// Use initial value just in case
values = [email.value, password.value];
usePersistentSession = checkbox.checked;

/**
  @type {string | undefined}
  Prefer temporary sessions over persistent sessions
*/
const lastSession = getCookie(TOKEN_LOCATION) ?? storage.getItem("rvlt:token");

if (lastSession) {
  token = atob(decodeURIComponent(lastSession));

  startSocket();

  togglePage();
}

if (CLIENT_FRIENDLY_NAME && VERSION) {
  const title = document.querySelector("h1#name");
  title.innerText = `${CLIENT_FRIENDLY_NAME} v${VERSION}`;
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  token = await login(values, usePersistentSession);
  if (token) startSocket();
});

email.addEventListener("change", (ev) => {
  values[0] = ev.currentTarget.value;
});

password.addEventListener("change", (ev) => {
  values[1] = ev.currentTarget.value;
});

checkbox.addEventListener("change", (ev) => {
  usePersistentSession = ev.currentTarget.checked;
});

function setToken(newValue) {
  token = newValue;
}

// We are using token in a lot of places so why not let everyone use it
export { token, setToken, storage };
