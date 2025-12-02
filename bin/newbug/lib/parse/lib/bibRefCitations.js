/*
<bibRefCitation 
    id="FCE3BBB4CB07C7AB682FBD69BC94900B" 
    DOI="https://doi.org/10.11646/zootaxa.1333.1.2" 
    author="Liang, AP" 
    journalOrPublisher="Zootaxa" 
    … 
    title="Revision of the Oriental and eastern Palaearctic planthopper…" 
    refString="Liang, AP, Song, ZS, 2006. Revision of the Oriental and…" 
    type="journal article",
    url="https://doi.org/10.11646/zootaxa.1333.1.2" 
    volume="1333" 
    year="2006">
    Liang and Song 2006
</bibRefCitation>
*/
// export function parseBibRefCitations($) {
//     return $('bibRefCitation')
//         .get()
//         .filter(a => $(a).attr('id'))
//         .map(a => {
//             return {
//                 bibRefCitationId  : $(a).attr('id'),
//                 DOI               : $(a).attr('DOI')                || '',
//                 author            : $(a).attr('author')             || '',
//                 journalOrPublisher: $(a).attr('journalOrPublisher') || '',
//                 title             : $(a).attr('title')              || '',
//                 refString         : $(a).attr('refString')          || '',
//                 type              : $(a).attr('type')               || '',
//                 year              : $(a).attr('year')               || '',
//                 innertext         : $(a).cleanText()
//             }
//         })
// }

import { toArray, attr, attrOr, keysToAttrs } from "./utils.js";


export function parseBibRefCitations($) {
    const keys = [
        'DOI', 
        'author', 
        'journalOrPublisher', 
        'title', 
        'refString', 
        'type', 
        'year'
    ];

    return toArray($('bibRefCitation'))
        .map(el => {
            const $el = $(el);
            const id = attr($el, 'id');
            if (!id) return null;

            return {
                bibRefCitationId: id,
                ...keysToAttrs($el, keys),
                innertext: $el.cleanText()
            };
            
        })
        .filter(Boolean);
};