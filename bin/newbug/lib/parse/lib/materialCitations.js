function deleted(del) {

    if (del && del === 'true') {
        return 1;
    }

    return 0;
}

/*
<collectionCode 
    country="Spain" 
    httpUri="http://biocol.org/urn:lsid:biocol.org:col:35275" lsid="urn:lsid:biocol.org:col:35275" 
    name="Museo Nacional de Ciencias Naturales" 
    type="Museum">
    MNCN
</collectionCode>
*/
function parseCollectionCodes($, a, collectionCode, materialCitationId) {

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

function isOnLand(latitude, longitude) {

    if (latitude && longitude) {
        return isSea(latitude, longitude) ? 0 : 1;
    }

}

/*
<materialsCitation id="64B83C8FFFC1FFD8EE32FCF23490FC53" 
    collectionCode="MCP" 
    collectorName="Jerez de la Frontera &amp; Canuto de la Gallina &amp; de Propios" 
    country="Spain" 
    location="Montes de Propios" 
    specimenCount="1" 
    typeStatus="paratype">
    <collectionCode country="Brazil" 
        httpUri="http://grbio.org/cool/bqgs-f9q8" 
        name="Pontificia Universidade Catolica do Rio Grande do Sul">
        MCP
    </collectionCode>
</materialsCitation>
*/
export function parseMaterialCitations($) {
    const getIsOnLand = false;
    
    const materialCitations = $('materialsCitation')
        .get()
        .map(a => {
            const materialCitationId = $(a).attr('id');

            // collectionCode from <materialsCitation collectionCode="">
            const collectionCode = $(a).attr('collectionCode') || '';
            const collectionCodes = parseCollectionCodes(
                $, a, collectionCode, materialCitationId
            );

            const latitude = $(a).attr('latitude') || '';
            const longitude = $(a).attr('longitude') || '';

            return {
                materialCitationId,
                collectingDate     : $(a).attr('collectingDate')       || '',
                collectionCodeCSV  : $(a).attr('collectionCode')       || '',
                collectorName      : $(a).attr('collectorName')        || '',
                country            : $(a).attr('country')              || '',
                collectingRegion   : $(a).attr('collectingRegion')     || '',
                municipality       : $(a).attr('municipality')         || '',
                county             : $(a).attr('county')               || '',
                stateProvince      : $(a).attr('stateProvince')        || '',
                location           : $(a).attr('location')             || '',
                locationDeviation  : $(a).attr('locationDeviation')    || '',
                specimenCountFemale: $(a).attr('specimenCount-female') || '',
                specimenCountMale  : $(a).attr('specimenCount-male')   || '',
                specimenCount      : $(a).attr('specimenCount')        || '',
                specimenCode       : $(a).attr('specimenCode')         || '',
                typeStatus         : $(a).attr('typeStatus')           || '',
                determinerName     : $(a).attr('determinerName')       || '',
                collectedFrom      : $(a).attr('collectedFrom')        || '',
                collectingMethod   : $(a).attr('collectingMethod')     || '',
                latitude,
                longitude,
                elevation          : $(a).attr('elevation')            || '',
                isOnLand: getIsOnLand ? isOnLand(latitude, longitude): '',
                httpUri            : $(a).attr('httpUri')              || '',
                updateVersion      : $(a).attr('updateVersion')        || '',
                deleted            : deleted($(a).attr('deleted')),
                fulltext           : $(a).cleanText(),
                collectionCodes
            }
        });

    return materialCitations;
}