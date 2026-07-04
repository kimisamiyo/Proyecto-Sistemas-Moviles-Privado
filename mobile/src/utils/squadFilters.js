/** Escuadras para explorar: excluye solo las que ya integras directamente. */
export function filterSquadsForExplore(openSquads = [], mySquads = []) {
  const joinedIds = new Set(mySquads.map((s) => String(s._id)));

  return (openSquads || []).filter((s) => {
    return !joinedIds.has(String(s._id));
  });
}
