const speedInput = document.querySelector("#speed-input");
const stepByStepRadio = document.querySelector("#step-by-step");
const disablerContainers = document.querySelectorAll(".disabler-container");

function getDelay() {
  return 1000 / (Number(speedInput.value) || 1);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let currGen = null;

function animateStep() {
  if (currGen === null) return { done: true };

  const next = currGen.next();

  if (!next.done) {
    window.tree = next.value;
    treeToHtml(window.tree);
    drawTrees();
  } else {
    updateLastHistoryEntry({
      result: next.value,
    });
    currGen = null;
    disablerContainers.forEach((container) =>
      container.classList.add("hidden"),
    );
    renderHistory();
  }

  return next;
}

async function animate(userDelay = null, skip = false) {
  if (currGen === null) return { done: true };

  const inputDelay = getDelay();
  const delay = userDelay ?? inputDelay;

  if (delay > 0) await wait(delay);

  const next = animateStep();

  if (next.done) return next.value;

  if (skip || !stepByStepRadio.checked) return await animate(delay, skip);
}

function setAnimateGen(gen) {
  if (currGen !== null) return;

  currGen = gen;
  disablerContainers.forEach((container) =>
    container.classList.remove("hidden"),
  );
  renderHistory();
}

function hasTheAnimationEnded() {
  return currGen === null;
}
