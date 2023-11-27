const indicatorText = document.getElementById("names");
const indicator = document.querySelector("div.indicator#typing");

/**
  Toggle Indicator visibility
  TODO: Make it modular, as in, can be reused for later components
  @param {boolean} show
  @returns {void}
*/
function setIndicatorVisibility(show) {
  if (!show){
    indicator.classList.add("hidden");
  } else {
    indicator.classList.remove("hidden")
  }
}

/**
  @param {string[]} names
  @returns {void}
*/
function updateIndicatorValues(names) {
  switch (names.length) {
    case 0:
      setIndicatorVisibility(false);
      break;
    case 1:
      setIndicatorVisibility(true);
      indicatorText.innerText = `${names.length} user is typing`
      break;
    default:
      indicatorText.innerText = `${names.length} users are typing`;
      break;        
  }
}

export { updateIndicatorValues };
