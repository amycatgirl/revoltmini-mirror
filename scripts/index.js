import { startSocket, togglePage } from "./app.js";
import { TOKEN_LOCATION } from "./globals.js";
import { login } from "./login.js";
import { getCookie } from "./utils.js";

/** @type {HTMLInputElement} */
const email = document.querySelector("main form input[type='email']");
/** @type {HTMLInputElement} */
const password = document.querySelector("main form input[type='password']");
/** @type {HTMLFormElement} */
const form = document.querySelector("main form");

/**
  @type {[string, string]}
  
  [email, password]
*/
let values = [];

/** @type {string} */
let token = "";

// Use initial value just in case
values = [email.value, password.value];

/** @type {string | undefined} */
const lastSession = getCookie(TOKEN_LOCATION);

if (lastSession) {
  token = atob(decodeURIComponent(lastSession));
  console.log("token from cookie", token);

  startSocket();

  togglePage();
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  token = await login(values);
  if (token) startSocket();
});

email.addEventListener("change", (ev) => {
  values[0] = ev.currentTarget.value;
});

password.addEventListener("change", (ev) => {
  values[1] = ev.currentTarget.value;
});

function setToken(newValue) {
  token = newValue;
}

// We are using token in a lot of places so why not let everyone use it
export { token, setToken };
