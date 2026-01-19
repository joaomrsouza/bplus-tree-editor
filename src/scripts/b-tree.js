/**
 * Estrutura de um nó da árvore B
 * @typedef {Object} BNode
 * @property {Array} keys - Array de chaves ordenadas
 * @property {Array<BNode>} children - Array de ponteiros para nós filhos
 * @property {boolean} isLeaf - Indica se o nó é uma folha
 * @property {boolean} highlight - Indica se o nó está sendo observado
 */

/**
 * Estrutura da árvore B
 * @typedef {Object} BTree
 * @property {BNode|null} root - Nó raiz da árvore
 * @property {number} fanout - Número máximo de chaves por nó
 * @property {'number' | 'string'} valueType - Tipo de valor (number ou string)
 * @property {Set<number | string>} values - Conjunto de valores inseridos na árvore
 * @property {string} type - Tipo da árvore ('b')
 */

/**
 * Cria uma nova árvore B vazia
 * @param {number} fanout - Número máximo de chaves por nó (deve ser >= 3)
 * @param {'number' | 'string'} valueType - Tipo de valor (number ou string)
 * @returns {BTree} Nova árvore B vazia
 */
function createBTree(fanout = 3, valueType = "number") {
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
    type: 'b'
  };
}

/**
 * Cria um novo nó da árvore B
 * @param {boolean} isLeaf - Se o nó é uma folha
 * @returns {BNode} Novo nó
 */
function createBNode(isLeaf = true) {
  return {
    keys: [],
    children: [], 
    isLeaf: isLeaf,
    highlight: false,
  };
}

/**
 * Clona um nó recursivamente (deep copy)
 */
function cloneBNode(node) {
  if (!node) return null;
  return {
    keys: [...node.keys],
    children: node.children.map(child => cloneBNode(child)),
    isLeaf: node.isLeaf,
    highlight: false,
  };
}

/**
 * Clona uma árvore completamente
 */
function cloneBTree(tree) {
  return {
    root: cloneBNode(tree.root),
    fanout: tree.fanout,
    valueType: tree.valueType,
    values: new Set(tree.values),
    readCount: tree.readCount,
    writeCount: tree.writeCount,
    type: 'b'
  };
}

/**
 * Remove todos os highlights de uma árvore
 */
function clearBHighlights(node) {
  if (!node) return;
  node.highlight = false;
  node.children.forEach(clearBHighlights);
}

/**
 * Busca um valor na árvore B
 * DIFERENÇA B+: Se encontrar em nó interno, retorna true imediatamente.
 */
function* searchB(tree, value) {
  const cloned = cloneBTree(tree);

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

    // Busca binária ou linear no nó
    let i = 0;
    while (i < current.keys.length && value > current.keys[i]) {
      i++;
    }

    // Se encontrou a chave
    if (i < current.keys.length && value === current.keys[i]) {
      current.highlight = true;
      yield cloned;
      current.highlight = false;
      yield cloned; // Mostra encontrado
      return true;
    }

    // Se é folha e não encontrou, retornar false
    if (current.isLeaf) {
      yield cloned;
      return false;
    }

    // Desce para o filho apropriado
    current = current.children[i];
  }

  return false;
}

/**
 * Insere um valor na árvore B
 * DIFERENÇA B+: Chaves promovidas sobem e saem dos filhos.
 */
function* insertB(tree, value) {
  const cloned = cloneBTree(tree);

  // Se árvore vazia
  if (!cloned.root) {
    cloned.root = createBNode(true);
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

  // Verificar se valor já existe antes de começar (opcional, mas bom pra UX)
  // Como o searchB altera highlights, vamos fazer um check "silencioso" ou deixar o processo falhar na inserção?
  // O original bp-tree.js usa 'cloned.values.has'.
  if (cloned.values.has(value)) {
      yield cloned;
      return false; // Valor já existe
  }
  
  clearBHighlights(cloned.root);

  // Função auxiliar de inserção recursiva com BOOTOM-UP SPLIT
  // Retorna null (sucesso) ou { key, rightChild } (necessidade de elevar chave)
  function* insertRecursive(node, val) {
     node.highlight = true;
     cloned.readCount++;
     yield cloned;
     node.highlight = false;

     let splitResult = null;

     if (node.isLeaf) {
         // Inserção ordenada na folha
         let i = 0;
         while (i < node.keys.length && val > node.keys[i]) {
             i++;
         }
         
         // Inserir
         node.keys.splice(i, 0, val);
         cloned.writeCount++;
         
         node.highlight = true;
         yield cloned;
         node.highlight = false;
         
     } else {
         // Nó interno
         let i = 0;
         while (i < node.keys.length && val > node.keys[i]) {
             i++;
         }
         
         // Descer recursivamente
         splitResult = yield* insertRecursive(node.children[i], val);
         
         if (splitResult) {
             // O filho dividiu. Precisamos inserir a chave promovida neste nó.
             // A chave 'val' original já foi tratada lá embaixo. Aqui tratamos 'splitResult.key'.
             
             node.highlight = true;
             yield cloned;
             
             // Inserir a chave promovida na posição correta
             // Como descemos em children[i], a chave promovida deve entrar em keys[i]
             // e o novo filho (rightChild) deve entrar em children[i+1].
             
             // Verificação de consistência: splitResult.key deve ser > node.keys[i-1] e < node.keys[i]
             // Isso é garantido pela lógica da descida.
             
             node.keys.splice(i, 0, splitResult.key);
             node.children.splice(i + 1, 0, splitResult.rightChild);
             cloned.writeCount++;
             
             node.highlight = false;
             yield cloned;
         } else {
             // Se não houve split do filho, terminamos por aqui neste nível
             return null; 
         }
     }
     
     // Checar Overflow (Fanout = Máximo de Chaves)
     if (node.keys.length > cloned.fanout) {
         return splitBNode(node);
     }
     
     return null;
  }
  
  function splitBNode(u) {
      // Fanout M. Overflow se chaves = M + 1.
      // Escolhe mediana.
      // Se length = 4 (0,1,2,3). t = 2 (indice).
      // keys[0], keys[1] ficam na esquerda.
      // keys[2] SOBE. 
      // keys[3] fica na direita.
      
      const t = Math.floor(u.keys.length / 2);
      const middleKey = u.keys[t];
      
      const v = createBNode(u.isLeaf);
      
      // Direita recebe t+1 até fim
      v.keys = u.keys.slice(t + 1);
      
      if (!u.isLeaf) {
          // Filhos: nó com K chaves tem K+1 filhos.
          // u tinha length chaves e length+1 filhos.
          // Esquerda tem t chaves. Deve ter t+1 filhos.
          // Indices 0 a t.
          // Direita tem (length - 1 - t) chaves. Deve ter filhos restantes.
          // t+1 a fim.
          v.children = u.children.slice(t + 1);
          u.children = u.children.slice(0, t + 1);
      }
      
      // Esquerda fica com 0 a t (exclusivo t, ou seja, 0..t-1)
      u.keys = u.keys.slice(0, t);
      
      cloned.writeCount += 2;
      
      // middleKey é RETORNADO para ser inserido no pai, NÃO FICA nem em u nem em v.
      return { key: middleKey, rightChild: v };
  }

  const rootSplit = yield* insertRecursive(cloned.root, value);
  
  if (rootSplit) {
      // Raiz dividiu
      const newRoot = createBNode(false);
      newRoot.keys = [rootSplit.key];
      newRoot.children = [cloned.root, rootSplit.rightChild];
      cloned.root = newRoot;
      cloned.writeCount++;
      newRoot.highlight = true;
      yield cloned;
      newRoot.highlight = false;
  }
  
  cloned.values.add(value);
  yield cloned;
  return true;
}

/**
 * Remove um valor da árvore B
 */
function* removeB(tree, value) {
  const cloned = cloneBTree(tree);
  
  if (!cloned.values.has(value)) {
      yield cloned;
      return false;
  }
  
  cloned.values.delete(value);
  
  if (!cloned.root) {
      yield cloned;
      return true;
  }

  // Mínimo de chaves = ceil(fanout/2) - 1.
  // Se fanout=3, min=1.
  function getMinKeys() {
      // Se fanout 3 (ordem 4? ou max keys 3?).
      // Se fanout significa Max Keys:
      // Ordem m (max filhos) = fanout + 1.
      // Min filhos = ceil(m/2).
      // Min chaves = ceil(m/2) - 1.
      // Ex: Fanout 3. m=4. min filhos=2. min chaves=1.
      // Ex: Fanout 4. m=5. min filhos=3. min chaves=2.
      // Ex: Fanout 5. m=6. min filhos=3. min chaves=2.
      const m = cloned.fanout + 1;
      return Math.ceil(m / 2) - 1;
  }
  
  const minKeys = getMinKeys();

  function* deleteNode(node, val) {
     node.highlight = true;
     cloned.readCount++;
     yield cloned;
     node.highlight = false;

     let idx = 0;
     while (idx < node.keys.length && val > node.keys[idx]) {
         idx++;
     }
     
     // Caso 1: Chave encontrada neste nó
     if (idx < node.keys.length && node.keys[idx] === val) {
         if (node.isLeaf) {
             // 1a: Remover de folha
             node.keys.splice(idx, 1);
             cloned.writeCount++;
             node.highlight = true;
             yield cloned;
             node.highlight = false;
         } else {
             // 1b: Remover de nó interno
             // Tentar predecessor (filho[idx] - esquerdo da chave)
             // ou sucessor (filho[idx+1] - direito da chave)
             const leftChild = node.children[idx];
             const rightChild = node.children[idx + 1];
             
             if (leftChild.keys.length > minKeys) {
                 // Usar predecessor
                 // Encontrar maior chave na subárvore esquerda
                 let predNode = leftChild;
                 while (!predNode.isLeaf) {
                     predNode = predNode.children[predNode.children.length - 1]; // desce direita
                 }
                 const predecessor = predNode.keys[predNode.keys.length - 1];
                 
                 // Substituir chave por predecessor
                 node.keys[idx] = predecessor;
                 cloned.writeCount++;
                 node.highlight = true;
                 yield cloned;
                 node.highlight = false;
                 
                 // Recursivamente deletar predecessor do filho
                 yield* deleteNode(leftChild, predecessor);
                 
             } else if (rightChild.keys.length > minKeys) {
                 // Usar sucessor
                 let succNode = rightChild;
                 while (!succNode.isLeaf) {
                     succNode = succNode.children[0]; // desce esquerda
                 }
                 const successor = succNode.keys[0];
                 
                 node.keys[idx] = successor;
                 cloned.writeCount++;
                 node.highlight = true;
                 yield cloned;
                 node.highlight = false;
                 
                 yield* deleteNode(rightChild, successor);
                 
             } else {
                 // 1c: Ambos filhos têm minKeys. Merge.
                 // Pivô 'val' desce para unir os dois filhos.
                 // leftChild + val + rightChild
                 leftChild.keys.push(val);
                 leftChild.keys.push(...rightChild.keys);
                 if (!leftChild.isLeaf) {
                     leftChild.children.push(...rightChild.children);
                 }
                 
                 // Remover val e ponteiro para rightChild do nó atual
                 node.keys.splice(idx, 1);
                 node.children.splice(idx + 1, 1);
                 cloned.writeCount += 3;
                 
                 node.highlight = true;
                 yield cloned;
                 node.highlight = false;
                 
                 // Agora remover a chave (que foi movida para leftChild) de leftChild
                 yield* deleteNode(leftChild, val);
             }
         }
         return;
     }
     
     // Caso 2: Chave não está neste nó. (Deve estar em um filho)
     if (node.isLeaf) {
         return; // Não encontrado (não deve acontecer se value está no Set)
     }
     
     // Garantir que o filho onde vamos descer tem pelo menos minKeys + 1
     // para evitar chegar numa folha vazia
     const childIdx = idx; // O filho onde a chave estaria é children[idx]
     const child = node.children[childIdx];
     
     if (child.keys.length <= minKeys) {
         // Tentar empréstimo ou merge antes de descer
         const leftSibling = childIdx > 0 ? node.children[childIdx - 1] : null;
         const rightSibling = childIdx < node.children.length - 1 ? node.children[childIdx + 1] : null;
         
         if (leftSibling && leftSibling.keys.length > minKeys) {
             // Emprestar da esquerda (Rotação à direita)
             // Sibling -> Parent -> Child
             
             // Chave do pai desce para inicio do child
             child.keys.unshift(node.keys[childIdx - 1]);
             
             // Chave do sibling sobe para o pai
             node.keys[childIdx - 1] = leftSibling.keys.pop();
             
             // Ponteiro do sibling passa para child (se não for folha)
             if (!child.isLeaf) {
                 child.children.unshift(leftSibling.children.pop());
             }
             
             cloned.writeCount += 3;
             // Visual highlight?
             
         } else if (rightSibling && rightSibling.keys.length > minKeys) {
             // Emprestar da direita (Rotação à esquerda)
             // Sibling -> Parent -> Child
             
             // Chave do pai desce para fim do child
             child.keys.push(node.keys[childIdx]);
             
             // Chave do sibling sobe para o pai
             node.keys[childIdx] = rightSibling.keys.shift();
             
             if (!child.isLeaf) {
                 child.children.push(rightSibling.children.shift());
             }
             
             cloned.writeCount += 3;
             
         } else {
             // Merge
             if (leftSibling) {
                 // Merge leftSibling + parentKey + child
                 // O parentKey é keys[childIdx - 1]
                 const parentKey = node.keys[childIdx - 1];
                 
                 leftSibling.keys.push(parentKey);
                 leftSibling.keys.push(...child.keys);
                 if (!leftSibling.isLeaf) {
                     leftSibling.children.push(...child.children);
                 }
                 
                 // Remover chave e ponteiro child do pai
                 node.keys.splice(childIdx - 1, 1);
                 node.children.splice(childIdx, 1);
                 
                 cloned.writeCount += 3;
                 
                 // Agora o filho onde a chave está é leftSibling
                 // (child foi fundido nele)
                 yield* deleteNode(leftSibling, val);
                 return;
                 
             } else if (rightSibling) {
                 // Merge child + parentKey + rightSibling
                 // parentKey é keys[childIdx]
                 const parentKey = node.keys[childIdx];
                 
                 child.keys.push(parentKey);
                 child.keys.push(...rightSibling.keys);
                 if (!child.isLeaf) {
                     child.children.push(...rightSibling.children);
                 }
                 
                 // Remover chave e ponteiro rightSibling do pai
                 node.keys.splice(childIdx, 1);
                 node.children.splice(childIdx + 1, 1);
                 
                 cloned.writeCount += 3;
                 
                 yield* deleteNode(child, val);
                 return;
             }
         }
     }
     
     // Descer
     yield* deleteNode(child, val);
  }

  yield* deleteNode(cloned.root, value);
  
  // Se a raiz ficou vazia (após um merge que puxou a última chave),
  // a nova raiz é o filho 0 (que foi o resultado do merge)
  if (cloned.root && cloned.root.keys.length === 0 && !cloned.root.isLeaf) {
      cloned.root = cloned.root.children[0];
      cloned.writeCount++;
  } else if (cloned.root && cloned.root.keys.length === 0 && cloned.root.isLeaf) {
      cloned.root = null;
  }
  
  clearBHighlights(cloned.root);
  yield cloned;
  return true;
}

window.createBTree = createBTree;
window.searchB = searchB;
window.insertB = insertB;
window.removeB = removeB;
