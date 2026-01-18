/**
 * Estrutura de um nó da árvore B+
 * @typedef {Object} BPlusNode
 * @property {Array} keys - Array de chaves ordenadas
 * @property {Array<BPlusNode>} children - Array de ponteiros para nós filhos (apenas em nós internos)
 * @property {boolean} isLeaf - Indica se o nó é uma folha
 * @property {boolean} highlight - Indica se o nó está sendo observado
 * @property {BPlusNode|null} next - Ponteiro para a próxima folha (apenas em folhas)
 */

/**
 * Estrutura da árvore B+
 * @typedef {Object} BPlusTree
 * @property {BPlusNode|null} root - Nó raiz da árvore
 * @property {number} fanout - Número máximo de chaves por nó
 * @property {'number' | 'string'} valueType - Tipo de valor (number ou string)
 * @property {Set<number | string>} values - Conjunto de valores inseridos na árvore
 */

/**
 * Cria uma nova árvore B+ vazia
 * @param {number} fanout - Número máximo de chaves por nó (deve ser >= 3)
 * @param {'number' | 'string'} valueType - Tipo de valor (number ou string)
 * @returns {BPlusTree} Nova árvore B+ vazia
 */
function createTree(fanout = 3, valueType = 'number') {
  if (fanout < 3) {
    throw new Error("Fanout deve ser pelo menos 3");
  }
  return {
    root: null,
    fanout: fanout,
    valueType: valueType,
    values: new Set(),
    readCount: 0,
    writeCount: 0,
  };
}

/**
 * Cria um novo nó da árvore B+
 * @param {boolean} isLeaf - Se o nó é uma folha
 * @returns {BPlusNode} Novo nó
 */
function createNode(isLeaf = true) {
  return {
    keys: [],
    children: isLeaf ? null : [],
    isLeaf: isLeaf,
    highlight: false,
    next: isLeaf ? null : null,
  };
}

/**
 * Clona um nó recursivamente (deep copy)
 * @param {BPlusNode} node - Nó a ser clonado
 * @returns {BPlusNode} Nó clonado
 */
function cloneNode(node) {
  if (!node) return null;

  const cloned = {
    keys: [...node.keys],
    children: node.children
      ? node.children.map((child) => cloneNode(child))
      : null,
    isLeaf: node.isLeaf,
    highlight: false,
    next: node.next ? cloneNode(node.next) : null,
  };

  return cloned;
}

/**
 * Clona uma árvore completamente
 * @param {BPlusTree} tree - Árvore a ser clonada
 * @returns {BPlusTree} Árvore clonada
 */
function cloneTree(tree) {
  return {
    root: cloneNode(tree.root),
    fanout: tree.fanout,
    valueType: tree.valueType,
    values: new Set(tree.values),
    readCount: tree.readCount,
    writeCount: tree.writeCount,
  };
}

/**
 * Marca um nó específico como highlight em uma cópia da árvore
 * @param {BPlusTree} tree - Árvore base
 * @param {BPlusNode} targetNode - Nó a ser destacado
 * @returns {BPlusTree} Árvore com o nó destacado
 */
function highlightNodeInTree(tree, targetNode) {
  const cloned = cloneTree(tree);

  function markNode(node, target) {
    if (!node) return false;

    if (node === target) {
      node.highlight = true;
      return true;
    }

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        if (markNode(node.children[i], target)) {
          return true;
        }
      }
    }

    return false;
  }

  markNode(cloned.root, targetNode);
  return cloned;
}

/**
 * Remove todos os highlights de uma árvore
 * @param {BPlusNode} node - Nó raiz
 */
function clearHighlights(node) {
  if (!node) return;
  node.highlight = false;
  if (node.children) {
    node.children.forEach(clearHighlights);
  }
}

/**
 * Busca um valor na árvore B+
 * @param {BPlusTree} tree - Árvore onde buscar
 * @param {*} value - Valor a ser buscado
 * @yields {BPlusTree} Árvore com o nó atual destacado
 * @returns {boolean} True se o valor foi encontrado, false caso contrário
 */
function* search(tree, value) {
  const cloned = cloneTree(tree);

  if (!cloned.root) {
    yield cloned;
    return false;
  }

  let current = cloned.root;

  while (current) {
    cloned.readCount++;
    current.highlight = true;
    yield cloned;
    current.highlight = false;

    if (current.isLeaf) {
      // Busca na folha
      for (let i = 0; i < current.keys.length; i++) {
        if (current.keys[i] === value) {
          current.highlight = true;
          yield cloned;
          current.highlight = false;
          yield cloned;
          return true;
        }
      }
      current.highlight = false;
      yield cloned;
      return false;
    } else {
      // Navega no nó interno
      let found = false;
      for (let i = 0; i < current.keys.length; i++) {
        if (value < current.keys[i]) {
          current = current.children[i];
          found = true;
          break;
        }
      }
      if (!found) {
        current = current.children[current.children.length - 1];
      }
    }
  }

  clearHighlights(cloned.root);
  yield cloned;

  return false;
}

/**
 * Encontra a posição de inserção em um nó folha
 * @param {BPlusNode} node - Nó folha
 * @param {*} value - Valor a inserir
 * @returns {number} Índice onde inserir
 */
function findInsertPosition(node, value) {
  for (let i = 0; i < node.keys.length; i++) {
    if (value < node.keys[i]) {
      return i;
    }
  }
  return node.keys.length;
}

/**
 * Divide um nó quando ele excede o fanout
 * @param {BPlusNode} node - Nó a ser dividido
 * @param {number} fanout - Fanout da árvore
 * @param {BPlusTree} tree - Árvore (para incrementar writeCount)
 * @returns {Object} Objeto com left, right e middleKey
 */
function splitNode(node, fanout, tree) {
  const mid = Math.ceil((fanout + 1) / 2);

  const right = createNode(node.isLeaf);
  tree.writeCount += 2; // Modifica o nó original e cria um novo

  if (node.isLeaf) {
    // Para folhas, todas as chaves ficam nas folhas
    right.keys = node.keys.slice(mid);
    right.next = node.next;
    node.keys = node.keys.slice(0, mid);
    node.next = right;
    // A primeira chave da folha direita sobe para o pai
    return { left: node, right, middleKey: right.keys[0] };
  } else {
    // Para nós internos, a chave do meio sobe
    const middleKey = node.keys[mid];
    right.keys = node.keys.slice(mid + 1);
    right.children = node.children.slice(mid + 1);
    node.keys = node.keys.slice(0, mid);
    node.children = node.children.slice(0, mid + 1);
    return { left: node, right, middleKey };
  }
}

/**
 * Insere uma chave em um nó folha
 * @param {BPlusNode} node - Nó folha
 * @param {*} value - Valor a inserir
 * @returns {boolean} True se inseriu, false se já existe
 */
function insertIntoLeaf(node, value, tree) {
  // Verifica se o valor já existe no array ordenado
  for (let i = 0; i < node.keys.length; i++) {
    if (node.keys[i] === value) {
      return false; // Valor já existe
    }
  }

  const pos = findInsertPosition(node, value);
  node.keys.splice(pos, 0, value);
  tree.writeCount++;
  return true;
}

/**
 * Insere recursivamente em um nó interno após um split
 * @param {BPlusNode} node - Nó interno
 * @param {*} separatorKey - Chave separadora a inserir
 * @param {BPlusNode} newChild - Novo filho criado pelo split
 * @param {number} fanout - Fanout da árvore
 * @param {BPlusTree} tree - Árvore (para incrementar writeCount)
 * @returns {Object|null} Objeto com key e child se houver split, null caso contrário
 */
function insertIntoInternal(node, separatorKey, newChild, fanout, tree) {
  if (!newChild) return null;

  let pos = 0;
  for (let i = 0; i < node.keys.length; i++) {
    if (separatorKey < node.keys[i]) {
      pos = i;
      break;
    }
    pos = i + 1;
  }

  node.keys.splice(pos, 0, separatorKey);
  node.children.splice(pos + 1, 0, newChild);
  tree.writeCount++;

  if (node.keys.length > fanout) {
    const split = splitNode(node, fanout, tree);
    return { key: split.middleKey, child: split.right };
  }

  return null;
}

/**
 * Insere um valor na árvore B+
 * @param {BPlusTree} tree - Árvore onde inserir
 * @param {*} value - Valor a ser inserido
 * @yields {BPlusTree} Árvore com o nó atual destacado
 * @returns {BPlusTree|false} Árvore atualizada ou false se o valor já existe
 */
function* insert(tree, value) {
  const cloned = cloneTree(tree);

  if (!cloned.root) {
    cloned.root = createNode(true);
    cloned.root.keys.push(value);
    cloned.root.highlight = true;
    cloned.readCount++;
    cloned.writeCount++;
    yield cloned;
    cloned.root.highlight = false;
    cloned.values.add(value);
    yield cloned;
    return true;
  }

  // Encontra a folha onde inserir
  const path = [];
  let current = cloned.root;

  while (!current.isLeaf) {
    cloned.readCount++;
    current.highlight = true;
    yield cloned;
    current.highlight = false;

    path.push(current);
    let found = false;
    for (let i = 0; i < current.keys.length; i++) {
      if (value < current.keys[i]) {
        current = current.children[i];
        found = true;
        break;
      }
    }
    if (!found) {
      current = current.children[current.children.length - 1];
    }
  }

  // Insere na folha
  cloned.readCount++;
  current.highlight = true;
  yield cloned;

  if (!insertIntoLeaf(current, value, cloned)) {
    current.highlight = false;
    yield cloned;
    return false; // Valor já existe
  }

  // Valor inserido com sucesso, adiciona ao Set
  cloned.values.add(value);

  yield cloned;

  // Verifica se precisa dividir a folha
  if (current.keys.length > cloned.fanout) {
    const split = splitNode(current, cloned.fanout, cloned);
    const separatorKey = split.middleKey;
    const newChild = split.right;

    current.highlight = false;
    newChild.highlight = true;
    yield cloned;

    // Propaga o split para cima
    if (path.length === 0) {
      // Cria nova raiz
      const newRoot = createNode(false);
      newRoot.keys.push(separatorKey);
      newRoot.children.push(current);
      newRoot.children.push(newChild);
      cloned.root = newRoot;
      cloned.writeCount++;
      newRoot.highlight = true;
      yield cloned;
      return cloned;
    }

    cloned.readCount++;
    let parent = path[path.length - 1];
    parent.highlight = true;
    yield cloned;

    let splitResult = insertIntoInternal(
      parent,
      separatorKey,
      newChild,
      cloned.fanout,
      cloned
    );

    for (let i = path.length - 2; i >= 0; i--) {
      parent.highlight = false;
      cloned.readCount++;
      parent = path[i];
      parent.highlight = true;
      yield cloned;

      if (splitResult) {
        // Insere a chave separadora e o novo filho direito no pai
        splitResult = insertIntoInternal(
          parent,
          splitResult.key,
          splitResult.child,
          cloned.fanout,
          cloned
        );
      } else {
        break;
      }
    }

    // Se ainda há split, cria nova raiz
    if (splitResult) {
      const newRoot = createNode(false);
      newRoot.keys.push(splitResult.key);
      // O nó esquerdo já está em cloned.root (foi modificado pelo splitNode)
      newRoot.children.push(cloned.root);
      newRoot.children.push(splitResult.child);
      cloned.root = newRoot;
      cloned.writeCount++;
      newRoot.highlight = true;
      yield cloned;
    }
  }

  clearHighlights(cloned.root);

  yield cloned;
  return true;
}

/**
 * Encontra o predecessor de uma chave em um nó
 * @param {BPlusNode} node - Nó folha
 * @param {*} value - Valor
 * @returns {number} Índice do predecessor ou -1
 */
function findPredecessorIndex(node, value) {
  for (let i = 0; i < node.keys.length; i++) {
    if (node.keys[i] === value) {
      return i;
    }
  }
  return -1;
}

/**
 * Remove uma chave de um nó folha
 * @param {BPlusNode} node - Nó folha
 * @param {*} value - Valor a remover
 * @param {BPlusTree} tree - Árvore (para incrementar writeCount)
 * @returns {boolean} True se removeu, false se não encontrou
 */
function removeFromLeaf(node, value, tree) {
  const index = findPredecessorIndex(node, value);
  if (index === -1) return false;
  node.keys.splice(index, 1);
  tree.writeCount++;
  return true;
}

/**
 * Encontra o irmão esquerdo de um nó
 * @param {BPlusNode} parent - Nó pai
 * @param {number} childIndex - Índice do filho
 * @returns {BPlusNode|null} Irmão esquerdo ou null
 */
function getLeftSibling(parent, childIndex) {
  if (childIndex > 0) {
    return parent.children[childIndex - 1];
  }
  return null;
}

/**
 * Encontra o irmão direito de um nó
 * @param {BPlusNode} parent - Nó pai
 * @param {number} childIndex - Índice do filho
 * @returns {BPlusNode|null} Irmão direito ou null
 */
function getRightSibling(parent, childIndex) {
  if (childIndex < parent.children.length - 1) {
    return parent.children[childIndex + 1];
  }
  return null;
}

/**
 * Faz merge de dois nós folha
 * @param {BPlusNode} left - Nó esquerdo
 * @param {BPlusNode} right - Nó direito
 * @param {BPlusTree} tree - Árvore (para incrementar writeCount)
 */
function mergeLeaves(left, right, tree) {
  left.keys.push(...right.keys);
  left.next = right.next;
  tree.writeCount++;
}

/**
 * Faz merge de dois nós internos
 * @param {BPlusNode} left - Nó esquerdo
 * @param {BPlusNode} right - Nó direito
 * @param {*} separatorKey - Chave separadora do pai
 * @param {BPlusTree} tree - Árvore (para incrementar writeCount)
 */
function mergeInternals(left, right, separatorKey, tree) {
  left.keys.push(separatorKey, ...right.keys);
  left.children.push(...right.children);
  tree.writeCount++;
}

/**
 * Propaga a remoção para cima quando um nó interno fica com poucas chaves
 * @param {BPlusTree} tree - Árvore
 * @param {Array} path - Caminho até o nó que precisa ser corrigido
 * @param {number} startIndex - Índice no path onde começar a correção
 * @yields {BPlusTree} Árvore com o nó atual destacado
 */
function* propagateRemovalUp(tree, path, startIndex) {
  const minKeys = Math.ceil(tree.fanout / 2);

  for (let i = startIndex; i >= 0; i--) {
    const parentInfo = path[i];
    const parent = parentInfo.node;
    const childIndex = parentInfo.index;

    // Se o nó tem chaves suficientes, para
    if (parent.keys.length >= minKeys || i === 0) {
      // Se é a raiz e ficou vazia, atualiza
      if (i === 0 && parent.keys.length === 0) {
        if (parent.isLeaf) {
          tree.root = null;
        } else {
          tree.root = parent.children[0];
        }
        tree.writeCount++;
        yield tree;
      }
      break;
    }

    // Precisa corrigir este nó
    const grandparentInfo = i > 0 ? path[i - 1] : null;
    const grandparent = grandparentInfo ? grandparentInfo.node : null;
    const parentIndex = grandparentInfo ? grandparentInfo.index : -1;

    tree.readCount++;
    parent.highlight = true;
    yield tree;

    const leftSibling = grandparent && parentIndex > 0
      ? grandparent.children[parentIndex - 1]
      : null;
    const rightSibling = grandparent && parentIndex < grandparent.children.length - 1
      ? grandparent.children[parentIndex + 1]
      : null;

    if (leftSibling) tree.readCount++;
    if (rightSibling) tree.readCount++;

    // Tenta emprestar do irmão direito
    // Só empresta se o irmão tiver MAIS que minKeys (pelo menos minKeys + 1)
    // para garantir que após o empréstimo ele ainda tenha pelo menos minKeys
    if (rightSibling && rightSibling.keys.length >= minKeys + 1) {
      parent.highlight = false;
      rightSibling.highlight = true;
      yield tree;

      // Move a chave separadora do pai para o nó atual
      const separatorKey = grandparent.keys[parentIndex];
      parent.keys.push(separatorKey);

      // Move a primeira chave do irmão direito para o pai
      grandparent.keys[parentIndex] = rightSibling.keys[0];
      rightSibling.keys.shift();

      // Move o primeiro filho do irmão direito para o nó atual
      parent.children.push(rightSibling.children.shift());

      tree.writeCount += 3; // Modifica parent, grandparent e rightSibling
      rightSibling.highlight = false;
      parent.highlight = true;
      yield tree;
      break;
    }
    // Tenta emprestar do irmão esquerdo
    // Só empresta se o irmão tiver MAIS que minKeys (pelo menos minKeys + 1)
    // para garantir que após o empréstimo ele ainda tenha pelo menos minKeys
    else if (leftSibling && leftSibling.keys.length >= minKeys + 1) {
      parent.highlight = false;
      leftSibling.highlight = true;
      yield tree;

      // Move a chave separadora do pai para o nó atual (no início)
      const separatorKey = grandparent.keys[parentIndex - 1];
      parent.keys.unshift(separatorKey);

      // Move a última chave do irmão esquerdo para o pai
      grandparent.keys[parentIndex - 1] = leftSibling.keys[leftSibling.keys.length - 1];
      leftSibling.keys.pop();

      // Move o último filho do irmão esquerdo para o nó atual (no início)
      parent.children.unshift(leftSibling.children.pop());

      tree.writeCount += 3; // Modifica parent, grandparent e leftSibling
      leftSibling.highlight = false;
      parent.highlight = true;
      yield tree;
      break;
    }
    // Faz merge com irmão (apenas se não exceder o fanout)
    else {
      parent.highlight = false;
      if (rightSibling) {
        rightSibling.highlight = true;
        yield tree;

        const separatorKey = grandparent.keys[parentIndex];
        const totalKeys = parent.keys.length + 1 + rightSibling.keys.length;

        // Verifica se o merge excederia o fanout
        if (totalKeys > tree.fanout) {
          // Redistribui as chaves de forma equilibrada entre os dois nós
          const allKeys = [...parent.keys, separatorKey, ...rightSibling.keys];
          const allChildren = [...parent.children, ...rightSibling.children];

          // Divide de forma que ambos tenham pelo menos minKeys
          // O nó esquerdo fica com pelo menos minKeys, o direito com o restante
          const leftKeysCount = Math.max(minKeys, Math.floor(allKeys.length / 2));
          parent.keys = allKeys.slice(0, leftKeysCount);
          parent.children = allChildren.slice(0, leftKeysCount + 1);
          rightSibling.keys = allKeys.slice(leftKeysCount + 1);
          rightSibling.children = allChildren.slice(leftKeysCount + 1);

          // Atualiza a chave separadora no pai (chave que separa os dois nós)
          grandparent.keys[parentIndex] = allKeys[leftKeysCount];

          tree.writeCount += 3; // Modifica parent, rightSibling e grandparent
          rightSibling.highlight = false;
          parent.highlight = true;
          yield tree;
          break; // Redistribuição completa, não precisa propagar mais
        } else {
          // Faz merge normal
          mergeInternals(parent, rightSibling, separatorKey, tree);
          grandparent.keys.splice(parentIndex, 1);
          grandparent.children.splice(parentIndex + 1, 1);
          tree.writeCount++; // Modifica grandparent

          // Atualiza o índice no path para o próximo nível
          if (i > 0) {
            path[i - 1].index = parentIndex;
          }

          rightSibling.highlight = false;
          parent.highlight = true;
          yield tree;
        }
      } else if (leftSibling) {
        leftSibling.highlight = true;
        yield tree;

        const separatorKey = grandparent.keys[parentIndex - 1];
        const totalKeys = leftSibling.keys.length + 1 + parent.keys.length;

        // Verifica se o merge excederia o fanout
        if (totalKeys > tree.fanout) {
          // Redistribui as chaves de forma equilibrada entre os dois nós
          const allKeys = [...leftSibling.keys, separatorKey, ...parent.keys];
          const allChildren = [...leftSibling.children, ...parent.children];

          // Divide de forma que ambos tenham pelo menos minKeys
          // O nó esquerdo fica com pelo menos minKeys, o direito com o restante
          const leftKeysCount = Math.max(minKeys, Math.floor(allKeys.length / 2));
          leftSibling.keys = allKeys.slice(0, leftKeysCount);
          leftSibling.children = allChildren.slice(0, leftKeysCount + 1);
          parent.keys = allKeys.slice(leftKeysCount + 1);
          parent.children = allChildren.slice(leftKeysCount + 1);

          // Atualiza a chave separadora no pai (chave que separa os dois nós)
          grandparent.keys[parentIndex - 1] = allKeys[leftKeysCount];

          // Atualiza a referência no path
          path[i].node = leftSibling;
          path[i].index = parentIndex - 1;

          tree.writeCount += 3; // Modifica leftSibling, parent e grandparent
          leftSibling.highlight = false;
          parent.highlight = true;
          yield tree;
          break; // Redistribuição completa, não precisa propagar mais
        } else {
          // Faz merge normal
          mergeInternals(leftSibling, parent, separatorKey, tree);
          grandparent.keys.splice(parentIndex - 1, 1);
          grandparent.children.splice(parentIndex, 1);
          tree.writeCount++; // Modifica grandparent

          // Atualiza a referência no path: o nó atual agora é o leftSibling
          path[i].node = leftSibling;
          path[i].index = parentIndex - 1;

          // Atualiza o índice no path para o próximo nível
          if (i > 0) {
            path[i - 1].index = parentIndex - 1;
          }

          leftSibling.highlight = false;
          parent.highlight = true;
          yield tree;
        }
      }

      // Continua propagando para cima apenas se fez merge completo
      parent.highlight = false;
    }
  }
}

/**
 * Remove um valor da árvore B+
 * @param {BPlusTree} tree - Árvore onde remover
 * @param {*} value - Valor a ser removido
 * @yields {BPlusTree} Árvore com o nó atual destacado
 * @returns {BPlusTree} Árvore atualizada
 */
function* remove(tree, value) {
  const cloned = cloneTree(tree);
  cloned.values.delete(value);

  if (!cloned.root) {
    yield cloned;
    return false;
  }

  // Encontra a folha onde está o valor
  const path = [];
  let current = cloned.root;

  while (!current.isLeaf) {
    cloned.readCount++;
    current.highlight = true;
    yield cloned;
    current.highlight = false;

    path.push({ node: current, index: -1 });
    let found = false;
    for (let i = 0; i < current.keys.length; i++) {
      if (value < current.keys[i]) {
        path[path.length - 1].index = i;
        current = current.children[i];
        found = true;
        break;
      }
    }
    if (!found) {
      path[path.length - 1].index = current.children.length - 1;
      current = current.children[current.children.length - 1];
    }
  }

  // Remove da folha
  cloned.readCount++;
  current.highlight = true;
  yield cloned;

  if (!removeFromLeaf(current, value, cloned)) {
    current.highlight = false;
    yield cloned;
    return false; // Valor não encontrado
  }

  // Se a raiz é uma folha e ficou vazia, define root como null
  if (path.length === 0 && current.keys.length === 0) {
    cloned.root = null;
    cloned.writeCount++;
    current.highlight = false;
    yield cloned;
    return true;
  }

  // Verifica se a folha ficou muito pequena (menos de ceil(fanout/2) chaves)
  const minKeys = Math.ceil(cloned.fanout / 2);

  if (current.keys.length < minKeys && path.length > 0) {
    const parentInfo = path[path.length - 1];
    const parent = parentInfo.node;
    const childIndex = parentInfo.index;

    cloned.readCount++; // Lê o parent
    const leftSibling = getLeftSibling(parent, childIndex);
    const rightSibling = getRightSibling(parent, childIndex);
    if (leftSibling) cloned.readCount++;
    if (rightSibling) cloned.readCount++;

    // Tenta emprestar do irmão direito
    // Só empresta se o irmão tiver MAIS que minKeys (pelo menos minKeys + 1)
    // para garantir que após o empréstimo ele ainda tenha pelo menos minKeys
    if (rightSibling && rightSibling.keys.length >= minKeys + 1) {
      current.highlight = false;
      rightSibling.highlight = true;
      yield cloned;

      const borrowedKey = rightSibling.keys.shift();
      current.keys.push(borrowedKey);
      parent.keys[childIndex] = rightSibling.keys[0];

      cloned.writeCount += 3; // Modifica current, rightSibling e parent
      rightSibling.highlight = false;
      current.highlight = true;
      yield cloned;
    }
    // Tenta emprestar do irmão esquerdo
    // Só empresta se o irmão tiver MAIS que minKeys (pelo menos minKeys + 1)
    // para garantir que após o empréstimo ele ainda tenha pelo menos minKeys
    else if (leftSibling && leftSibling.keys.length >= minKeys + 1) {
      current.highlight = false;
      leftSibling.highlight = true;
      yield cloned;

      const borrowedKey = leftSibling.keys.pop();
      current.keys.unshift(borrowedKey);
      parent.keys[childIndex - 1] = borrowedKey;

      cloned.writeCount += 3; // Modifica current, leftSibling e parent
      leftSibling.highlight = false;
      current.highlight = true;
      yield cloned;
    }
    // Faz merge com irmão
    else {
      current.highlight = false;
      if (rightSibling) {
        rightSibling.highlight = true;
        yield cloned;
        mergeLeaves(current, rightSibling, cloned);
        parent.keys.splice(childIndex, 1);
        parent.children.splice(childIndex + 1, 1);
        cloned.writeCount++; // Modifica parent
      } else if (leftSibling) {
        leftSibling.highlight = true;
        yield cloned;
        mergeLeaves(leftSibling, current, cloned);
        parent.keys.splice(childIndex - 1, 1);
        parent.children.splice(childIndex, 1);
        cloned.writeCount++; // Modifica parent
        current = leftSibling;
      }

      // Propaga a remoção para cima se necessário
      parent.highlight = true;
      yield cloned;

      // Propaga a correção para cima nos nós internos
      const gen = propagateRemovalUp(cloned, path, path.length - 1);
      for (const treeState of gen) {
        yield treeState;
      }
    }
  }

  clearHighlights(cloned.root);

  yield cloned;
  return true;
}
