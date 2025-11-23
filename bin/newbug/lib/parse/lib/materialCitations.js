import { toArray, attr, attrOr, keysToAttrs, boolStrToInt } from "./utils.js";

function deleted(del) {
    return del && del === 'true' ? 1 : 0;
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
// function parseCollectionCodes($, a, collectionCode, materialCitationId) {

//     // collectionCodes from <collectionCode>
//     const collectionCodes = $('collectionCode', a)
//         .get()
//         .filter(a => $(a).attr('collectionCode') === collectionCode)
//         .map(a => {
//             return {
//                 //collectionCodeId: $(a).attr('id'),
//                 country         : $(a).attr('country')        || '',
//                 name            : $(a).attr('name')           || '',
//                 httpUri         : $(a).attr('httpUri')        || '',
//                 lsid            : $(a).attr('lsid')           || '',
//                 type            : $(a).attr('type')           || '',
//                 collectionCode  : $(a).attr('collectionCode') || '',
//                 materialCitationId
//             }
//         });

//     // collectionCodes from <specimenCode>
//     const specimenCodes = $('specimenCode', a)
//         .get()
//         .filter(a => $(a).attr('collectionCode') === collectionCode)
//         .map(a => {
//             return {
//                 //collectionCodeId: $(a).attr('id'),
//                 country         : $(a).attr('country')        || '',
//                 name            : $(a).attr('name')           || '',
//                 httpUri         : $(a).attr('httpUri')        || '',
//                 lsid            : $(a).attr('lsid')           || '',
//                 type            : $(a).attr('type')           || '',
//                 collectionCode  : $(a).attr('collectionCode') || '',
//                 materialCitationId
//             }
//         });

//     collectionCodes.push(...specimenCodes);
//     return collectionCodes.flat();
// }

function parseCollectionCodes($, containerEl, collectionCode, materialCitationId) {
    const $container = $(containerEl);

    const collect = (selector) =>
        toArray($(selector, $container))
            .filter(el => attr($(el), 'collectionCode') === collectionCode)
            .map(el => {
                const $el = $(el);
                return {
                country: attrOr($el, 'country'),
                name: attrOr($el, 'name'),
                httpUri: attrOr($el, 'httpUri'),
                lsid: attrOr($el, 'lsid'),
                type: attrOr($el, 'type'),
                collectionCode: attrOr($el, 'collectionCode'),
                materialCitationId
                };
            });

    // append specimenCode results to collectionCode results
    return [...collect('collectionCode'), ...collect('specimenCode')];
};

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
// export function parseMaterialCitations($) {
//     const getIsOnLand = false;
    
//     const materialCitations = $('materialsCitation')
//         .get()
//         .map(a => {
//             const materialCitationId = $(a).attr('id');

//             // collectionCode from <materialsCitation collectionCode="">
//             const collectionCode = $(a).attr('collectionCode') || '';
//             const collectionCodes = parseCollectionCodes(
//                 $, a, collectionCode, materialCitationId
//             );

//             const latitude = $(a).attr('latitude') || '';
//             const longitude = $(a).attr('longitude') || '';

//             return {
//                 materialCitationId,
//                 collectingDate     : $(a).attr('collectingDate')       || '',
//                 collectionCodeCSV  : $(a).attr('collectionCode')       || '',
//                 collectorName      : $(a).attr('collectorName')        || '',
//                 country            : $(a).attr('country')              || '',
//                 collectingRegion   : $(a).attr('collectingRegion')     || '',
//                 municipality       : $(a).attr('municipality')         || '',
//                 county             : $(a).attr('county')               || '',
//                 stateProvince      : $(a).attr('stateProvince')        || '',
//                 location           : $(a).attr('location')             || '',
//                 locationDeviation  : $(a).attr('locationDeviation')    || '',
//                 specimenCountFemale: $(a).attr('specimenCount-female') || '',
//                 specimenCountMale  : $(a).attr('specimenCount-male')   || '',
//                 specimenCount      : $(a).attr('specimenCount')        || '',
//                 specimenCode       : $(a).attr('specimenCode')         || '',
//                 typeStatus         : $(a).attr('typeStatus')           || '',
//                 determinerName     : $(a).attr('determinerName')       || '',
//                 collectedFrom      : $(a).attr('collectedFrom')        || '',
//                 collectingMethod   : $(a).attr('collectingMethod')     || '',
//                 latitude,
//                 longitude,
//                 elevation          : $(a).attr('elevation')            || '',
//                 isOnLand: getIsOnLand ? isOnLand(latitude, longitude): '',
//                 httpUri            : $(a).attr('httpUri')              || '',
//                 updateVersion      : $(a).attr('updateVersion')        || '',
//                 deleted            : deleted($(a).attr('deleted')),
//                 fulltext           : $(a).cleanText(),
//                 collectionCodes
//             }
//         });

//     return materialCitations;
// }

export function parseMaterialCitations($) {
    return toArray($('materialsCitation'))
        .map(el => {
            const $el = $(el);
            const materialCitationId = attr($el, 'id');

            const collectionCodeCSV = attr($el, 'collectionCode') || '';
            const collectionCodes = parseCollectionCodes($, el, collectionCodeCSV, materialCitationId);

            const latitude = attr($el, 'latitude');
            const longitude = attr($el, 'longitude');

            // keys that are simple attribute-to-field mapping
            const mapped = keysToAttrs($el, [
                'collectingDate',
                'collectorName',
                'country',
                'collectingRegion',
                'municipality',
                'county',
                'stateProvince',
                'location',
                'locationDeviation',
                'specimenCount-female',
                'specimenCount-male',
                'specimenCount',
                'specimenCode',
                'typeStatus',
                'determinerName',
                'collectedFrom',
                'collectingMethod',
                'elevation',
                'httpUri',
                'updateVersion'
            ]);

            // rename specimenCount-female / -male to camelCase keys used previously
            const normalized = {
                materialCitationId,
                collectingDate: mapped.collectingDate || '',
                collectionCodeCSV,
                collectorName: mapped.collectorName || '',
                country: mapped.country || '',
                collectingRegion: mapped.collectingRegion || '',
                municipality: mapped.municipality || '',
                county: mapped.county || '',
                stateProvince: mapped.stateProvince || '',
                location: mapped.location || '',
                locationDeviation: mapped.locationDeviation || '',
                specimenCountFemale: mapped['specimenCount-female'] || '',
                specimenCountMale: mapped['specimenCount-male'] || '',
                specimenCount: mapped.specimenCount || '',
                specimenCode: mapped.specimenCode || '',
                typeStatus: mapped.typeStatus || '',
                determinerName: mapped.determinerName || '',
                collectedFrom: mapped.collectedFrom || '',
                collectingMethod: mapped.collectingMethod || '',
                latitude,
                longitude,
                elevation: mapped.elevation || '',
                httpUri: mapped.httpUri || '',
                updateVersion: mapped.updateVersion || '',
                deleted: boolStrToInt(attr($el, 'deleted')),
                fulltext: $el.cleanText(),
                collectionCodes
            };

            return normalized;
        });
};