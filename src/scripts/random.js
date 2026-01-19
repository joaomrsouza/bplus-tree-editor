async function randomInsert(qtd, min, max) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  for (let i = 0; i < qtd; i++) {
    const randomIndex = Math.floor(Math.random() * values.length);
    const value = values.splice(randomIndex, 1)[0];

    addHistoryEntry({
      type: "insert",
      value: value,
      initialTree: window.tree,
      result: null,
      color: "random",
    });

    const isBTree = window.tree.type === "b";
    const gen = isBTree
      ? insertB(window.tree, value)
      : insert(window.tree, value);

    setAnimateGen(gen);
    await animate();
    while (!hasTheAnimationEnded()) await wait(1);
  }
}

async function randomRemove(qtd) {
  const values = Array.from(window.tree.values);
  if (values.length < qtd) return;

  for (let i = 0; i < qtd; i++) {
    const randomIndex = Math.floor(Math.random() * values.length);
    const value = values.splice(randomIndex, 1)[0];

    addHistoryEntry({
      type: "remove",
      value: value,
      initialTree: window.tree,
      result: null,
      color: "random",
    });

    const isBTree = window.tree.type === "b";
    const gen = isBTree
      ? removeB(window.tree, value)
      : remove(window.tree, value);

    setAnimateGen(gen);
    await animate();
    while (!hasTheAnimationEnded()) await wait(1);
  }
}
