function getAnchor(element, position = "bottom") {
  const rect = element.getBoundingClientRect();

  if (position === "top") {
    return { x: rect.left + rect.width / 2, y: rect.top - 1 };
  } else if (position === "bottom") {
    return { x: rect.left + rect.width / 2, y: rect.bottom + 1 };
  } else if (position === "left") {
    return { x: rect.left - 1, y: rect.top + rect.height / 2 };
  } else if (position === "right") {
    return { x: rect.right + 1, y: rect.top + rect.height / 2 };
  }
}

const defaultPadding = 15;

function createPath(svg, pathData) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData.trim());
  path.setAttribute("stroke", "black");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  svg.appendChild(path);
}

function drawBPlusLines(nodes, nextNodes, isLeaf, scale, getPos, svg) {
  let pointerIndex = 0;
  nodes.forEach((node, ni) => {
    const pointers = Array.from(node.querySelectorAll(".tree-pointer"));

    pointers.forEach((pointer, pi) => {
      const nodeToPoint = nextNodes[pointerIndex];
      pointerIndex++;

      const isLastPointer = pi === pointers.length - 1;
      const nextNode = nodes[ni + 1];
      const shouldPointToNextNode = isLastPointer && isLeaf && nextNode;
      const shouldPointToNull = isLastPointer && isLeaf && !nextNode;

      const pointerAnchor = getAnchor(
        pointer,
        shouldPointToNextNode ? "right" : "bottom",
      );

      const nodeAnchor = nodeToPoint
        ? getAnchor(nodeToPoint, "top")
        : shouldPointToNextNode
          ? getAnchor(nextNode, "left")
          : {
              x: pointerAnchor.x,
              y: pointerAnchor.y + 15 * scale,
            };

      let pathData = `
        M ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y}
        L ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y + defaultPadding}
        L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y - defaultPadding}
        L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y}
      `;

      if (shouldPointToNextNode) {
        pathData = `
          M ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y}
          L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y}
        `;
      }

      createPath(svg, pathData);

      // Arrow lines logic
      const arrowLine1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      arrowLine1.setAttribute("x1", getPos(nodeAnchor).x);
      arrowLine1.setAttribute("y1", getPos(nodeAnchor).y);

      let al1x2 = getPos(nodeAnchor).x + defaultPadding / 2;
      let al1y2 = getPos(nodeAnchor).y - defaultPadding / 2;

      if (shouldPointToNextNode) {
        al1x2 = getPos(nodeAnchor).x - defaultPadding / 2;
        al1y2 = getPos(nodeAnchor).y + defaultPadding / 2;
      }
      if (shouldPointToNull) al1y2 = getPos(nodeAnchor).y; // Point to null/down

      arrowLine1.setAttribute("x2", al1x2);
      arrowLine1.setAttribute("y2", al1y2);
      arrowLine1.setAttribute("stroke", "black");
      arrowLine1.setAttribute("stroke-width", "2");
      svg.appendChild(arrowLine1);

      const arrowLine2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      arrowLine2.setAttribute("x1", getPos(nodeAnchor).x);
      arrowLine2.setAttribute("y1", getPos(nodeAnchor).y);

      let al2x2 = getPos(nodeAnchor).x - defaultPadding / 2;
      let al2y2 = getPos(nodeAnchor).y - defaultPadding / 2;

      if (shouldPointToNull) al2y2 = getPos(nodeAnchor).y;

      arrowLine2.setAttribute("x2", al2x2);
      arrowLine2.setAttribute("y2", al2y2);
      arrowLine2.setAttribute("stroke", "black");
      arrowLine2.setAttribute("stroke-width", "2");
      svg.appendChild(arrowLine2);
    });
  });
}

function drawBLines(nodes, nextNodes, isLeaf, getPos, svg) {
  let pointerIndex = 0;
  nodes.forEach((node) => {
    const pointers = Array.from(node.querySelectorAll(".tree-pointer"));

    pointers.forEach((pointer) => {
      const nodeToPoint = nextNodes[pointerIndex];
      pointerIndex++;

      // Na Arvore B, não há ponteiros entre folhas
      if (isLeaf) return;

      if (!nodeToPoint) return;

      const nodeAnchor = getAnchor(nodeToPoint, "top");
      const pointerAnchor = getAnchor(pointer, "bottom");

      let pathData = `
        M ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y}
        L ${getPos(pointerAnchor).x} ${getPos(pointerAnchor).y + defaultPadding}
        L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y - defaultPadding}
        L ${getPos(nodeAnchor).x} ${getPos(nodeAnchor).y}
      `;

      createPath(svg, pathData);

      // Generic Arrow Head
      const arrowLine1 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      arrowLine1.setAttribute("x1", getPos(nodeAnchor).x);
      arrowLine1.setAttribute("y1", getPos(nodeAnchor).y);
      arrowLine1.setAttribute("x2", getPos(nodeAnchor).x + defaultPadding / 2);
      arrowLine1.setAttribute("y2", getPos(nodeAnchor).y - defaultPadding / 2);
      arrowLine1.setAttribute("stroke", "black");
      arrowLine1.setAttribute("stroke-width", "2");
      svg.appendChild(arrowLine1);

      const arrowLine2 = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      arrowLine2.setAttribute("x1", getPos(nodeAnchor).x);
      arrowLine2.setAttribute("y1", getPos(nodeAnchor).y);
      arrowLine2.setAttribute("x2", getPos(nodeAnchor).x - defaultPadding / 2);
      arrowLine2.setAttribute("y2", getPos(nodeAnchor).y - defaultPadding / 2);
      arrowLine2.setAttribute("stroke", "black");
      arrowLine2.setAttribute("stroke-width", "2");
      svg.appendChild(arrowLine2);
    });
  });
}

function drawTrees() {
  const treeContainers = Array.from(
    document.querySelectorAll(".tree-container"),
  );

  treeContainers.forEach((treeContainer) => {
    const pan = treeContainer.querySelector(".pan");
    const scale = Number(
      pan.style.transform
        .split(" ")
        .find((p) => p.includes("scale"))
        ?.replace(/scale\(|\)/g, "") || 1,
    );
    const tree = treeContainer.querySelector(".tree");
    const svg = treeContainer.querySelector(".tree-svg");
    svg.innerHTML = "";

    // Set SVG size to match the page
    const treeRect = tree.getBoundingClientRect();
    svg.setAttribute("width", treeRect.width / scale);
    svg.setAttribute("height", treeRect.height / scale);

    const treeRows = Array.from(tree.querySelectorAll(".tree-row"));

    function getPos(xyObj) {
      return {
        x: (xyObj.x - treeRect.x) / scale,
        y: (xyObj.y - treeRect.y) / scale,
      };
    }

    const isBTree = window.tree && window.tree.type === "b";

    treeRows.forEach((row, rowIndex, rows) => {
      const nodes = Array.from(row.querySelectorAll(".tree-node"));
      const nextNodes =
        rowIndex < rows.length - 1
          ? Array.from(rows[rowIndex + 1].querySelectorAll(".tree-node"))
          : [];
      const isLeaf = rowIndex === treeRows.length - 1;

      if (isBTree) drawBLines(nodes, nextNodes, isLeaf, getPos, svg);
      else drawBPlusLines(nodes, nextNodes, isLeaf, scale, getPos, svg);
    });
  });
}
