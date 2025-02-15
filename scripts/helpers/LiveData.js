/**
 * Probably the worst thing i've ever coded in my entire life
 * lol
 */
export class LiveData {
  #target;

  constructor(initialData) {
    this.#target = new EventTarget();
    this.#value = initialData;
  }

  /**
   * @param {(ev: any) => void} callback
   * @returns {() => void}
   */
  observe(callback) {
    const controller = new AbortController();
    this.#target.addEventListener("post", ev => callback(ev.data.newValue), { signal: controller.signal });

    return function close() {
      controller.abort()
    }
  }

  /**
   * @param {any} value 
   */
  set #value(value) {
    this.#target.dispatchEvent(new MessageEvent("post", {
      data: {
        newValue: value,
      }
    }))
  }

  post(value) {
    this.#value = value;
  }
}
