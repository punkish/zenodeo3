/*
<collectionCode 
    country="Spain" 
    httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" 
    name="Museo Nacional de Ciencias Naturales" 
    type="Museum">
    MNCN
</collectionCode>
*/
export function parseCollectionCodes ($, a, collectionCode, materialCitationId) {

    // collectionCodes from <collectionCode>
    const collectionCodes = $('collectionCode', a)
        .get()
        .filter(a => $(a).attr('collectionCode') === collectionCode)
        .map(a => {
            return {
                //collectionCodeId: $(a).attr('id'),
                country         : $(a).attr('country')        || '',
                name            : $(a).attr('name')           || '',
                httpUri         : $(a).attr('httpUri')        || '',
                lsid            : $(a).attr('lsid')           || '',
                type            : $(a).attr('type')           || '',
                collectionCode  : $(a).attr('collectionCode') || '',
                materialCitationId
            }
        });

    // collectionCodes from <specimenCode>
    const specimenCodes = $('specimenCode', a)
        .get()
        .filter(a => $(a).attr('collectionCode') === collectionCode)
        .map(a => {
            return {
                //collectionCodeId: $(a).attr('id'),
                country         : $(a).attr('country')        || '',
                name            : $(a).attr('name')           || '',
                httpUri         : $(a).attr('httpUri')        || '',
                lsid            : $(a).attr('lsid')           || '',
                type            : $(a).attr('type')           || '',
                collectionCode  : $(a).attr('collectionCode') || '',
                materialCitationId
            }
        });

    collectionCodes.push(...specimenCodes);
    return collectionCodes.flat();
}