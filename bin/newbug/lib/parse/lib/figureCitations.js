/*
Some figureCitation tags have multiple citations within them 
(see xml fragment below). The attributes are suffixed with 
-0, -1 and so on.

<figureCitation id="10922A65E320FF95FD00FA16FCB8FA1F" 
    captionText-0="Fig. 1. Habitus of Carvalhoma species…" 
    captionText-1="Fig. 2. SEM images of C. malcolmae Slater…" 
    figureDoi-0="http://doi.org/10.5281/zenodo.3850851" 
    figureDoi-1="http://doi.org/10.5281/zenodo.3850855" 
    httpUri-0="https://zenodo.org/record/3850851/files/figure.png" 
    httpUri-1="https://zenodo.org/record/3850855/files/figure.png">
    Figs 1–2
</figureCitation>
*/
// export function parseFigureCitations($) {

//     const figureCitations = $('figureCitation')
//         .get()
//         .map(a => {
//             const figs = [];

//             if (a.parent.name !== 'updateHistory') {

//                 // Let's find out if this tag has multiple figs within as 
//                 // described above
//                 const matched = Object.keys(a.attribs)
//                     .filter(key => key.match(new RegExp('^captionText-[0-9]+', 'g')));

//                 const num_of_figs = matched.length;

//                 if (num_of_figs) {
//                     for (let figureNum = 0; figureNum < num_of_figs; figureNum++) {
//                         const figureCitationId = $(a).attr('id');

//                         figs.push({
//                             figureCitationId,
//                             figureNum,
//                             httpUri: $(a).attr(`httpUri-${figureNum}`) || '',
//                             figureDoiOriginal: $(a).attr(`figureDoi-${figureNum}`) || '',
//                             captionText: $(a).attr(`captionText-${figureNum}`) || '',
//                             innertext: $(a).text() || '',
//                             updateVersion: $(a).attr(`updateVersion-${figureNum}`) || ''
//                         });
//                     }
//                 }
//                 else {
//                     const figureCitationId = $(a).attr('id');

//                     figs.push({
//                         figureCitationId,
//                         figureNum: 0,
//                         httpUri: $(a).attr(`httpUri`) || '',
//                         figureDoiOriginal: $(a).attr(`figureDoi`) || '',
//                         captionText: $(a).attr(`captionText`) || '',
//                         innertext: $(a).text() || '',
//                         updateVersion: $(a).attr(`updateVersion`) || ''
//                     });
//                 }
//             }

//             return figs;
//         })
//         .flat();

//     return figureCitations;
// }

import { toArray, attr, attrOr, keysToAttrs } from "./utils.js";
const RE_CAPTION_INDEX = /^captionText-(\d+)$/;

export function parseFigureCitations($) {
  return toArray($('figureCitation'))
    .flatMap(el => {
        if (el.parent && el.parent.name === 'updateHistory') return [];
        const $el = $(el);
        const id = attr($el, 'id');

        // detect captionText-N attributes and collect indices
        const indices = Object.keys(el.attribs || {})
            .map(k => {
                const m = k.match(RE_CAPTION_INDEX);
                return m ? Number(m[1]) : null;
            })
            .filter(i => i !== null);

        const figIndices = indices.length ? indices : [0];

        return figIndices.map(i => {
            const suffix = i === 0 ? '' : `-${i}`;
            return {
                figureCitationId: id,
                figureNum: i,
                httpUri: attrOr($el, `httpUri${suffix}`).replace(/undefined$/, '') || '',
                figureDoiOriginal: attrOr($el, `figureDoi${suffix}`) || '',
                captionText: attrOr($el, `captionText${suffix}`) || '',
                innertext: $el.text() || '',
                updateVersion: attrOr($el, `updateVersion${suffix}`) || ''
            };
        });
    });
};