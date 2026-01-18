const treeContainers = Array.from(document.querySelectorAll(".tree-container"));

const panzooms = treeContainers.map((treeContainer) => {
  const treeContainerRect = treeContainer.getBoundingClientRect();
  const pan = treeContainer.querySelector(".pan");

  const panzoom = Panzoom(pan);

  panzoom.resetCenter = (options) => {
    const tree = pan.querySelector(".tree");
    const treeRect = tree.getBoundingClientRect();

    panzoom.setOptions({
      ...panzoom.getOptions(),
      startX: -treeRect.width / 2 + treeContainerRect.width / 2,
      startY: 0,
    })
    panzoom.reset(options);
  }

  treeContainer.addEventListener("wheel", panzoom.zoomWithWheel);
  treeContainer
    .querySelector(".zoom-plus")
    .addEventListener("click", panzoom.zoomIn);
  treeContainer
    .querySelector(".zoom-reset")
    .addEventListener("click", panzoom.resetCenter);
  treeContainer
    .querySelector(".zoom-minus")
    .addEventListener("click", panzoom.zoomOut);

  panzoom.resetCenter();

  return panzoom;
});
