function reset() {
  panzooms.forEach((panzoom) => {
    panzoom.reset({ animate: false });
  });
  drawTrees();
}

const resizeObserver = new ResizeObserver(reset);
resizeObserver.observe(document.querySelector("main"));

window.addEventListener("resize", reset);

reset();
