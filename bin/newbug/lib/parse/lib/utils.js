// --- Parsing helpers for node arrays ---
function toArray($collection) {
    return $collection.toArray();
}

// --- Helpers ---
function attr($el, name) {
    const v = $el.attr(name);
    return v == null ? '' : v;
};

function attrOr($el, name, fallback = '') {
    return attr($el, name) || fallback;
}

function keysToAttrs($el, keys) {
    return Object.fromEntries(keys.map(k => [k, attrOr($el, k)]));
}

function toIntIfNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : '';
};

function boolStrToInt(v) {
    return (v === 'true' ? 1 : 0);
}

export { toArray, attr, attrOr, keysToAttrs, toIntIfNumber, boolStrToInt }