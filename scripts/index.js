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

// Wait 5 seconds juuuuuust in case
setTimeout(async () => {
  /** @type {string | undefined} */
  const lastSession = getCookie(TOKEN_LOCATION);

  if (lastSession) {
    token = atob(decodeURIComponent(lastSession));
    console.log("token from cookie", token);

    startSocket();

    togglePage();
  }
}, 5000);

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  // Funny logic goes here
  await login(values).then((res) => (token = res));

  startSocket();

  console.log(values, document.cookie);

  togglePage();
});

email.addEventListener("change", (ev) => {
  values[0] = ev.currentTarget.value;
});

password.addEventListener("change", (ev) => {
  values[1] = ev.currentTarget.value;
});

// We are using token in a lot of places so why not let everyone use it
export { token };
