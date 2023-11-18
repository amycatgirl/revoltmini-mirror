self.addEventListener("push", (ev) => {
  async function processEvent() {
    if (ev.data) {
      console.log("debug/sw:", ev);
      const data = ev.data.json();

      await self.registration.showNotification("RevoltMini", {
        body: data.body,
      });
    }
  }

  ev.waitUntil(processEvent());
});
