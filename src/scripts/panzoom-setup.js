const treeContainers = Array.from(document.querySelectorAll(".tree-container"));

const panzooms = treeContainers.map((treeContainer) => {
  const tree = treeContainer.querySelector(".tree");

  const panzoom = Panzoom(tree, { maxScale: 5 });

  treeContainer.addEventListener("wheel", panzoom.zoomWithWheel);
  treeContainer
    .querySelector(".zoom-plus")
    .addEventListener("click", panzoom.zoomIn);
  treeContainer
    .querySelector(".zoom-reset")
    .addEventListener("click", panzoom.reset);
  treeContainer
    .querySelector(".zoom-minus")
    .addEventListener("click", panzoom.zoomOut);

  return panzoom;
});
