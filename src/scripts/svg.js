function getAnchor(element, position = "bottom") {
  const rect = element.getBoundingClientRect();

  if (position === "top") {
    return { x: rect.left + rect.width / 2, y: rect.top - 1 };
  } else if (position === "bottom") {
    return { x: rect.left + rect.width / 2, y: rect.bottom + 1 };
  }
}

function drawTrees() {
  const treeContainers = Array.from(
    document.querySelectorAll(".tree-container")
  );

  treeContainers.forEach((treeContainer) => {
    const tree = treeContainer.querySelector(".tree");
    const svg = treeContainer.querySelector(".tree-svg");
    svg.innerHTML = "";

    // Set SVG size to match the page
    const treeRect = tree.getBoundingClientRect();
    svg.setAttribute("width", treeRect.width);
    svg.setAttribute("height", treeRect.height);
    // svg.setAttribute("viewBox", `0 430 ${treeRect.width} ${treeRect.height}`);

    const treeRows = Array.from(tree.querySelectorAll(".tree-row"));

    function getPos(xyObj) {
      return {
        x: xyObj.x - treeRect.x,
        y: xyObj.y - treeRect.y,
      };
    }

    treeRows.forEach((row, rowIndex, rows) => {
      const nodes = Array.from(row.querySelectorAll(".tree-node"));
      const nextNodes =
        rowIndex < rows.length - 1
          ? Array.from(rows[rowIndex + 1].querySelectorAll(".tree-node"))
          : [];

      nodes.forEach((node, nodeIndex) => {
        const pointers = Array.from(node.querySelectorAll(".tree-pointer"));

        pointers.forEach((pointer, pointerIndex) => {
          const nodeToPointIndex = pointerIndex + pointers.length * nodeIndex;
          const nodeToPoint = nextNodes[nodeToPointIndex];

          const pointerAnchor = getAnchor(pointer, "bottom");
          const nodeAnchor = nodeToPoint
            ? getAnchor(nodeToPoint, "top")
            : {
                x: pointerAnchor.x,
                y: pointerAnchor.y + 15,
              };

          // Draw line from pointerAnchor to nodeAnchor using SVG
          const padding = 10;

          // Create path element for the connection line
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          const pathData = `
            M ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y}
            L ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y + padding}
            L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y - padding}
            L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y}
          `;
          path.setAttribute("d", pathData.trim());
          path.setAttribute("stroke", "black");
          path.setAttribute("stroke-width", "2");
          path.setAttribute("fill", "none");
          svg.appendChild(path);

          // Create arrow head (two lines forming a V)
          const arrowLine1 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          arrowLine1.setAttribute("x1", getPos(nodeAnchor).x);
          arrowLine1.setAttribute("y1", getPos(nodeAnchor).y);
          arrowLine1.setAttribute("x2", getPos(nodeAnchor).x + padding / 2);
          arrowLine1.setAttribute("y2", getPos(nodeAnchor).y - padding / 2);
          arrowLine1.setAttribute("stroke", "black");
          arrowLine1.setAttribute("stroke-width", "2");
          svg.appendChild(arrowLine1);

          const arrowLine2 = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
          );
          arrowLine2.setAttribute("x1", getPos(nodeAnchor).x);
          arrowLine2.setAttribute("y1", getPos(nodeAnchor).y);
          arrowLine2.setAttribute("x2", getPos(nodeAnchor).x - padding / 2);
          arrowLine2.setAttribute("y2", getPos(nodeAnchor).y - padding / 2);
          arrowLine2.setAttribute("stroke", "black");
          arrowLine2.setAttribute("stroke-width", "2");
          svg.appendChild(arrowLine2);
        });
      });
    });
  });
}
