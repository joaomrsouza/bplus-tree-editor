function printNodeInfo(node, depth = 0) {
  if (!node) return;

  const indent = "  ".repeat(depth);
  const type = node.isLeaf ? "FOLHA" : "INTERNO";
  const highlight = node.highlight ? " HIGHLIGHT" : "";

  console.log(`${indent}${type}${highlight}`);
  console.log(`${indent}  Chaves: [${node.keys.join(", ")}]`);

  if (!node.isLeaf && node.children) {
    console.log(`${indent}  Filhos: ${node.children.length}`);
  }

  if (node.isLeaf && node.next) {
    console.log(`${indent}  Próxima folha: tem`);
  }
}

function printTreeStructure(tree, title = "Estrutura da Árvore") {
  console.log(`\n${title}`);
  console.log(`   Fanout: ${tree.fanout}`);

  if (!tree.root) {
    console.log("   Árvore vazia");
    return;
  }

  function traverse(node, depth = 0) {
    if (!node) return;
    printNodeInfo(node, depth);

    if (node.children) {
      node.children.forEach((child) => traverse(child, depth + 1));
    }
  }

  traverse(tree.root);
}

async function animatedInsert(value) {
  addHistoryEntry({
    type: "insert",
    value: value,
    initialTree: window.bpTree,
    result: null,
    color: "random",
  });
  const gen = insert(window.bpTree, value);
  setAnimateGen(gen);
  await animate(0);
}

let debugPlusNumber = 0;

async function debugPlus() {
  debugPlusNumber++;
  await animatedInsert(debugPlusNumber);
}

async function bootstrap(number) {
  for (let i = 1; i <= number; i++) {
    await animatedInsert(i);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#debug-container").classList.remove("hidden");
});