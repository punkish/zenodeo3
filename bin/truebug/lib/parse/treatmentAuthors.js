export function parseTreatmentAuthors ($) {
    return $('mods\\:name[type=personal]')
        .get()
        .filter(a => $('mods\\:roleTerm', a).text() === 'Author')
        .map(a => {
            return {
                treatmentAuthorId: $(a).attr('id'),
                treatmentAuthor: $('mods\\:namePart', a).cleanText(),
                email: $('mods\\:nameIdentifier[type=email]', a).text()
            }
        })
}