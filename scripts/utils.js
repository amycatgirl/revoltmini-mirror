/**
  Get a cookie from this document's cookies
  @link https://www.w3schools.com/js/js_cookies.asp

  @param {string} name
  @returns {string | undefined}
*/
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

export { getCookie };
