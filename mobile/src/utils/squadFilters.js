/** Escuadras para explorar: excluye las que ya integras (por id o por evento, 1 escuadra/evento). */
export function filterSquadsForExplore(openSquads = [], mySquads = []) {
  const joinedIds = new Set(mySquads.map((s) => String(s._id)));
  const joinedEventIds = new Set(
    mySquads.map((s) => String(s.event?._id || s.event || '')).filter(Boolean)
  );

  return (openSquads || []).filter((s) => {
    const sid = String(s._id);
    const eid = String(s.event?._id || s.event || '');
    if (joinedIds.has(sid)) return false;
    if (eid && joinedEventIds.has(eid)) return false;
    return true;
  });
}
