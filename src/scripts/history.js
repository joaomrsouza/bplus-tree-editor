const historyContainer = document.querySelector("#history-container");

let historyEntries = [];

// type HistoryEntry = {
//   type: "insert" | "remove" | "search" | "message",
//   value: number | string,
//   initialTree: BPlusTree,
//   result: boolean | string | null
//   color: "random" | "manual" | "error" | "none"
//   disabled: boolean
// }

function renderHistory() {
  historyContainer.innerHTML = "";
  let lastEnabledEntry = null;

  historyEntries.forEach((entry, index) => {
    const entryElement = document.createElement("div");

    entryElement.classList.add("history-entry");

    if (entry.color !== "none") {
      entryElement.classList.add(
        {
          random: "random-mode",
          manual: "manual-mode",
          error: "error",
        }[entry.color],
      );
    }

    if (entry.disabled) entryElement.classList.add("disabled");
    else lastEnabledEntry = entryElement;

    const typeText = {
      insert: "inserido",
      remove: "removido",
      search: "buscado",
      message: "operação",
    }[entry.type];

    let message = {
      insert: `O valor ${entry.value} ${entry.result ? "foi inserido." : "já existe!"}`,
      remove: `O valor ${entry.value} ${entry.result ? "foi removido." : "não foi encontrado!"}`,
      search: `O valor ${entry.value} ${entry.result ? "foi encontrado." : "não foi encontrado!"}`,
      message: entry.result,
    }[entry.type];

    if (entry.result === null) {
      message = `O valor ${entry.value} está sendo ${typeText}...`;
    }

    entryElement.innerHTML = `
      <span>${message}</span>
      ${entry.initialTree === null ? "" : `<button class="icon" ${currGen !== null ? "disabled" : ""}><-</button>`}
    `;

    historyContainer.appendChild(entryElement);

    if (entry.initialTree === null) return;

    entryElement.querySelector("button").addEventListener("click", () => {
      window.tree = entry.initialTree;
      treeToHtml(window.tree);
      drawTrees();
      historyEntries.forEach((entry, i) => (entry.disabled = i >= index));
      renderHistory();
    });
  });

  if (lastEnabledEntry)
    lastEnabledEntry.scrollIntoView({ behavior: "smooth", block: "center" });
  else historyContainer.scrollTop = 0;
}

function addHistoryEntry(newEntry) {
  historyEntries = historyEntries.filter((entry) => !entry.disabled);
  historyEntries.push({ ...newEntry, disabled: false });
  historyEntries.push({
    type: "message",
    value: newEntry.value,
    initialTree: window.tree,
    result: "Árvore atual",
    color: "none",
    disabled: true,
  });
  renderHistory();
}

function updateLastHistoryEntry(newEntry) {
  historyEntries.pop();
  historyEntries[historyEntries.length - 1] = {
    ...historyEntries[historyEntries.length - 1],
    ...newEntry,
  };
  historyEntries.push({
    type: "message",
    value: newEntry.value,
    initialTree: window.tree,
    result: "Árvore atual",
    color: "none",
    disabled: true,
  });
  renderHistory();
}

function clearHistory() {
  historyEntries = [];
  renderHistory();
}
