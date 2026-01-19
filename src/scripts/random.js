async function randomInsert(qtd, min, max) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  for (let i = 0; i < qtd; i++) {
    const randomIndex = Math.floor(Math.random() * values.length);
    const value = values.splice(randomIndex, 1)[0];

    addHistoryEntry({
      type: "insert",
      value: value,
      initialTree: window.bpTree,
      result: null,
      color: "random",
    });

    const isBTree = window.bpTree.type === 'b';
    const gen = isBTree ? insertB(window.bpTree, value) : insert(window.bpTree, value);
    
    setAnimateGen(gen);
    await animate();
    while (!hasTheAnimationEnded()) await wait(100);
  }
}

async function randomRemove(qtd) {
  const values = Array.from(window.bpTree.values);
  if (values.length < qtd) return;

  for (let i = 0; i < qtd; i++) {
    const randomIndex = Math.floor(Math.random() * values.length);
    const value = values.splice(randomIndex, 1)[0];

    addHistoryEntry({
      type: "remove",
      value: value,
      initialTree: window.bpTree,
      result: null,
      color: "random",
    });

    const isBTree = window.bpTree.type === 'b';
    const gen = isBTree ? removeB(window.bpTree, value) : remove(window.bpTree, value);
    
    setAnimateGen(gen);
    await animate();
    while (!hasTheAnimationEnded()) await wait(100);
  }
}
