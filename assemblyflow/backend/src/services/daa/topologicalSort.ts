import { DAANode, DAAEdge, TopologicalSortResult, TopologicalStep } from './types';

/**
 * Executes Kahn's algorithm for Topological Sorting on the instruction DAG.
 * 
 * Algorithm:
 * 1. Compute in-degree (number of incoming edges) for each node.
 * 2. Collect all nodes with in-degree == 0 into an available list.
 * 3. Tie-Breaking: Deterministically pick the node with the lowest original instructionIndex.
 * 4. Append picked node to execution order, decrement in-degrees of its successors.
 * 5. If new nodes reach in-degree == 0, add them to available list.
 * 6. Repeat until all nodes are processed or a cycle is detected.
 * 
 * Time Complexity: O(V + E) where V = nodes, E = edges.
 */
export function kahnTopologicalSort(
  nodes: DAANode[],
  edges: DAAEdge[]
): TopologicalSortResult {
  const nodeMap = new Map<string, DAANode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  // 1. Calculate incoming-edge count (in-degree) for each node
  const inDegree: Record<string, number> = {};
  // Adjacency list: outgoing edges from each node
  const adjList = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree[n.id] = 0;
    adjList.set(n.id, []);
  }

  for (const edge of edges) {
    if (inDegree[edge.to] !== undefined) {
      inDegree[edge.to]++;
    }
    const currentAdj = adjList.get(edge.from) || [];
    currentAdj.push(edge.to);
    adjList.set(edge.from, currentAdj);
  }

  // Set of nodes currently available (in-degree == 0)
  const availableSet = new Set<string>();
  for (const n of nodes) {
    if (inDegree[n.id] === 0) {
      availableSet.add(n.id);
    }
  }

  const sortedOrder: string[] = [];
  const steps: TopologicalStep[] = [];
  let stepCount = 0;

  // Process nodes until no available nodes remain
  while (availableSet.size > 0) {
    stepCount++;

    // Deterministic tie-breaker: Pick node with smallest original instruction index
    const candidateIds = Array.from(availableSet);
    candidateIds.sort((a, b) => {
      const idxA = nodeMap.get(a)?.instructionIndex ?? 0;
      const idxB = nodeMap.get(b)?.instructionIndex ?? 0;
      return idxA - idxB;
    });

    const selectedId = candidateIds[0];
    availableSet.delete(selectedId);
    sortedOrder.push(selectedId);

    // Record snapshot of remaining in-degrees for this step
    const inDegreeSnapshot: Record<string, number> = { ...inDegree };

    // Remove outgoing edges from the selected node
    const neighbors = adjList.get(selectedId) || [];
    const newlyAvailable: string[] = [];

    for (const neighborId of neighbors) {
      inDegree[neighborId]--;
      if (inDegree[neighborId] === 0) {
        availableSet.add(neighborId);
        newlyAvailable.push(neighborId);
      }
    }

    steps.push({
      step: stepCount,
      selectedNode: selectedId,
      availableNodes: candidateIds,
      remainingInDegrees: inDegreeSnapshot,
      description: `Step ${stepCount}: Selected ${selectedId} (in-degree 0). Decremented successors [${neighbors.join(', ')}]. ${
        newlyAvailable.length > 0 ? `New ready node(s): [${newlyAvailable.join(', ')}].` : 'No new ready nodes.'
      }`,
    });
  }

  // Cycle detection: If sortedOrder count does not match total nodes
  const hasCycle = sortedOrder.length < nodes.length;
  let cycleError: string | undefined;

  if (hasCycle) {
    const unvisited = nodes.filter((n) => !sortedOrder.includes(n.id)).map((n) => n.id);
    cycleError = `Cycle detected in dependency graph. Unresolvable instructions: [${unvisited.join(
      ', '
    )}]. A valid topological order cannot be formed.`;
  }

  const orderedNodes = sortedOrder.map((id) => nodeMap.get(id)!).filter(Boolean);

  return {
    order: sortedOrder,
    orderedNodes,
    hasCycle,
    steps,
    cycleError,
  };
}
