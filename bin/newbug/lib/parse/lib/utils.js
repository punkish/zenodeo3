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

// --- Precompiled regexes & constants ---
const RE_DOUBLE_SPC = /\s+/g;
const RE_SPACE_COMMA = /\s+,/g;
const RE_SPACE_COLON = /\s+:/g;
const RE_SPACE_PERIOD = /\s+\./g;
const RE_OPENPAR_SPACE = /\(\s+/g;
const RE_SPACE_CLOSEPAR = /\s+\)/g;
const RE_CAPTION_INDEX = /^captionText-(\d+)$/;

export { 
    toArray, attr, attrOr, keysToAttrs, toIntIfNumber, boolStrToInt,
    RE_DOUBLE_SPC, RE_SPACE_COMMA, RE_SPACE_COLON, RE_SPACE_PERIOD,
    RE_OPENPAR_SPACE, RE_SPACE_CLOSEPAR, RE_CAPTION_INDEX
 }