const valueInput = document.querySelector("#value-input");
const minInput = document.querySelector("#min-input");
const maxInput = document.querySelector("#max-input");
const qtdInput = document.querySelector("#qtd-input");
const manualModeRadio = document.querySelector("#mode-manual");
const treeSelect = document.querySelector("#tree-type-select");

function getValue(value) {
  const type = window.tree.valueType;

  const isNumber = /^-?\d+$/.test(value);

  if (type === "number") {
    if (!isNumber) {
      addHistoryEntry({
        type: "message",
        value: Number(value),
        initialTree: null,
        result: "Valor inválido",
        color: "error",
      });
      return null;
    }

    return Number(value);
  }

  return value;
}

function getRandomInputs(qtdOnly = false) {
  const inputs = {
    qtd: Number(qtdInput.value),
    min: Number(minInput.value),
    max: Number(maxInput.value),
  };

  if (!/^\d+$/.test(qtdInput.value)) {
    addHistoryEntry({
      type: "message",
      value: qtdInput.value,
      initialTree: null,
      result: "Quantidade inválida",
      color: "error",
    });
    return;
  }

  if (inputs.qtd < 1) {
    addHistoryEntry({
      type: "message",
      value: inputs.qtd,
      initialTree: null,
      result: "Quantidade deve ser maior que 0",
      color: "error",
    });
    return;
  }

  if (qtdOnly) {
    if (inputs.qtd > window.tree.values.size) {
      addHistoryEntry({
        type: "message",
        value: inputs.qtd,
        initialTree: null,
        result:
          "Quantidade deve ser menor ou igual que a quantidade de valores na árvore",
        color: "error",
      });
      return;
    }
    return { qtd: Number(qtdInput.value) };
  }

  if (!/^-?\d+$/.test(minInput.value)) {
    addHistoryEntry({
      type: "message",
      value: minInput.value,
      initialTree: null,
      result: "Mínimo inválido",
      color: "error",
    });
    return;
  }

  if (!/^-?\d+$/.test(maxInput.value)) {
    addHistoryEntry({
      type: "message",
      value: maxInput.value,
      initialTree: null,
      result: "Máximo inválido",
      color: "error",
    });
    return;
  }

  if (inputs.min > inputs.max) {
    addHistoryEntry({
      type: "message",
      value: inputs.min,
      initialTree: null,
      result: "Mínimo maior que máximo",
      color: "error",
    });
    return;
  }

  if (inputs.max - inputs.min + 1 < inputs.qtd) {
    addHistoryEntry({
      type: "message",
      value: inputs.qtd,
      initialTree: null,
      result:
        "Quantidade não pode ser maior que a diferença entre máximo e mínimo",
      color: "error",
    });
    return;
  }

  return inputs;
}

// === Animation ===
const autoPlayRadio = document.querySelector("#auto-play");
const stepBtn = document.querySelector("#step-btn");
const skipBtn = document.querySelector("#skip-btn");

autoPlayRadio.addEventListener("change", async () => {
  if (autoPlayRadio.checked) await animate();
});

stepBtn.addEventListener("click", () => {
  animateStep();
});

skipBtn.addEventListener("click", async () => {
  await animate(1, true);
});

// === Search ===
const searchBtn = document.querySelector("#search-btn");

searchBtn.addEventListener("click", async () => {
  const value = getValue(valueInput.value);
  if (!value) return;

  addHistoryEntry({
    type: "search",
    value: value,
    initialTree: window.tree,
    result: null,
    color: "manual",
  });

  const gen =
    window.tree.type === "b"
      ? searchB(window.tree, value)
      : search(window.tree, value);

  setAnimateGen(gen);
  await animate();
});

// === Insert ===
const insertBtn = document.querySelector("#insert-btn");

insertBtn.addEventListener("click", async () => {
  if (manualModeRadio.checked) {
    const value = getValue(valueInput.value);
    if (!value) return;

    addHistoryEntry({
      type: "insert",
      value: value,
      initialTree: window.tree,
      result: null,
      color: "manual",
    });

    const gen =
      window.tree.type === "b"
        ? insertB(window.tree, value)
        : insert(window.tree, value);

    setAnimateGen(gen);

    await animate();
    return;
  }

  const randomInputs = getRandomInputs();
  if (!randomInputs) return;
  await randomInsert(randomInputs.qtd, randomInputs.min, randomInputs.max);
});

// === Remove ===
const removeBtn = document.querySelector("#remove-btn");
removeBtn.addEventListener("click", async () => {
  if (manualModeRadio.checked) {
    const value = getValue(valueInput.value);
    if (!value) return;
    addHistoryEntry({
      type: "remove",
      value: getValue(valueInput.value),
      initialTree: window.tree,
      result: null,
      color: "manual",
    });

    const gen =
      window.tree.type === "b"
        ? removeB(window.tree, value)
        : remove(window.tree, value);

    setAnimateGen(gen);

    await animate();
    return;
  }

  const randomInputs = getRandomInputs(true);
  if (!randomInputs) return;
  await randomRemove(randomInputs.qtd);
});

// === Clear ===
const clearBtn = document.querySelector("#clear-btn");

clearBtn.addEventListener("click", async () => {
  const treeType = treeSelect.value;

  if (treeType === "b")
    window.tree = createBTree(Number(fanoutInput.value), valueTypeSelect.value);
  else
    window.tree = createTree(Number(fanoutInput.value), valueTypeSelect.value);

  clearHistory();
  treeToHtml(window.tree);
  drawTrees();

  panzooms.forEach((panzoom) => panzoom.resetCenter());
});

// === Change Tree ===
const fanoutInput = document.querySelector("#fanout-input");
const valueTypeSelect = document.querySelector("#value-type-select");
const changeTreeBtn = document.querySelector("#change-tree-btn");

changeTreeBtn.addEventListener("click", async () => {
  if (!/^\d+$/.test(fanoutInput.value)) return;
  if (Number(fanoutInput.value) < 3) return;

  const treeType = treeSelect.value;

  if (treeType === "b")
    window.tree = createBTree(Number(fanoutInput.value), valueTypeSelect.value);
  else
    window.tree = createTree(Number(fanoutInput.value), valueTypeSelect.value);

  valueInput.type = valueTypeSelect.value;
  clearHistory();
  treeToHtml(window.tree);
  drawTrees();
});
