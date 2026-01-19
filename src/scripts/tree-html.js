function treeToHtml(tree) {
  const html = getTreeHtml(tree);
  document.querySelector(".tree-container .pan").innerHTML = html;
  document.querySelector("#count-container").innerHTML = `
    Leituras: ${tree.readCount} | Escritas: ${tree.writeCount} | Valores: ${tree.values.size}
  `;
}

function getTreeRows(node) {
  if (!node) return [];

  const rows = [];

  function traverse(currentNode, level) {
    if (!rows[level]) {
      rows[level] = [];
    }

    rows[level].push(currentNode);

    if (currentNode.children && currentNode.children.length > 0) {
      for (const child of currentNode.children) {
        traverse(child, level + 1);
      }
    }
  }

  traverse(node, 0);

  return rows;
}

function getTreeRowsHtml(rows) {
  return rows
    .map(
      (row) => `
    <div class="tree-row" style="margin-bottom: ${row.length * 15 + 50}px;">
      ${row
        .map(
          (node) => `
        <div class="tree-node ${node.highlight ? "highlight" : ""}">
          <div class="tree-pointer"></div>
            ${node.keys
              .map(
                (key) => `
              <div class="tree-kp">
                <div class="tree-key">${key}</div>
                <div class="tree-pointer"></div>
              </div>
            `,
              )
              .join("")}
        </div>
      `,
        )
        .join("")}
    </div>
  `,
    )
    .join("");
}

function getTreeHtml(tree) {
  return `
    <div class="tree">
      <svg class="tree-svg"></svg>
      ${getTreeRowsHtml(getTreeRows(tree.root))}
    </div>
  `;
}
