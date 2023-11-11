const app = document.querySelector("main#app");
const loginPage = document.querySelector("main#login");

function togglePage() {
  app.classList.toggle("hidden");
  loginPage.classList.toggle("hidden");
}

export { togglePage };
