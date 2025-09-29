/*
<treatmentCitation id="090D10E8FFADFFCE66FAFA5E33BBFA00" 
    author="Briggs" 
    year="1963">
    <bibRefCitation id="EC3D4B08FFADFFCE66FAFA5E334CFA00" 
        author="Briggs" 
        refString="Briggs, J. C. &amp; Link, G. (1963) New clingfishes of…" 
        type="journal article" 
        year="1963">
        Briggs &amp; Link 1963
    </bibRefCitation>
: 102
</treatmentCitation>
*/
export function parseTreatmentCitations($) {
    return $('treatmentCitationGroup', 'subSubSection[type=reference_group]')
        .get()
        .map(a => {
            const trecitgroup = $(a);
            const taxonomicName = $('taxonomicName', trecitgroup);            
            let tname = Array.isArray(taxonomicName) 
                ? taxonomicName[0] 
                : taxonomicName;

            const tcPreArr = [];

            if (tname.text()) {
                tcPreArr.push(tname.cleanText());
            }

            if (tname.attr('authorityName')) {
                tcPreArr.push(tname.attr('authorityName'));
            }

            tcPreArr.push(', ');

            if (tname.attr('authorityYear')) {
                tcPreArr.push(tname.attr('authorityYear'));
            }

            const tcPrefix = tcPreArr.join(' ');

            return $('treatmentCitation', trecitgroup)
                .get()
                .map(a => {
                    const bib = $('bibRefCitation', a);

                    if (bib) {
                        return {
                            treatmentCitationId: $(a).attr('id'),
                            bibRefCitationId: bib.attr('id'),
                            treatmentCitation: `${tcPrefix} sec. ${bib.cleanText()}`,
                            refString: bib.attr('refString') || ''
                        };
                    }
                });
        })
        .flat();
}