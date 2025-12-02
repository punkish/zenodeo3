import { toArray, attr } from "./utils.js";

// export function parseTreatmentAuthors($) {
//     return $('mods\\:name[type=personal]')
//         .get()
//         .filter(a => $('mods\\:roleTerm', a).text() === 'Author')
//         .map(a => {
//             return {
//                 treatmentAuthorId: $(a).attr('id'),
//                 treatmentAuthor: $('mods\\:namePart', a).cleanText(),
//                 email: $('mods\\:nameIdentifier[type=email]', a).text()
//             }
//         })
// }

export function parseTreatmentAuthors($) {
  return toArray($('mods\\:name[type=personal]'))
    .filter(el => $('mods\\:roleTerm', el).text() === 'Author')
    .map(el => {
        const $el = $(el);

        return {
            treatmentAuthorId: attr($el, 'id'),
            treatmentAuthor: $('mods\\:namePart', el).cleanText(),
            email: $('mods\\:nameIdentifier[type=email]', el).text() || ''
        };
        
    });
};