import { stopwords } from './stopwords.js';
import { styleText } from 'node:util';

function removeStopWords(txt) {  
    return txt.split(' ')
        .filter(word => word.length > 2)
        .filter(word => !stopwords.includes(word.toLowerCase()))
        .join(' ');
}

function cleanText(text) {
    text = text.replace(/…/g, '');
    text = text.replace(/\\/g, '');
    text = text.replace(/#/g, ' ');
    text = text.replace(/\. \./g, '.');
    text = text.replace(/\s\s+/g, ' ');
    text = text.replace(/(\r\n|\n|\r)/gm, ' ');
    return text.trim();
}

//                   bookEnds               
//                       │
//    ┌──────────────────┴─────────────────┐ 
//    │                                    │ 
//    ▼                                    ▼ 
//    …•••••••••••• searchTerm ••••••••••••… 
//          │     │            │     │
//          │     │            │     │
//         l0     l1           r0    r1
//          ◀─────▶            ◀─────▶
//             ▲                  ▲
//             │                  │
//             └─────────┬────────┘
//                       │
//                  bufferLength
function mySnippet(
    text, 
    searchTerm, 
    startTag = '<span class="hilite">',
    endTag = '</span>',
    bufferLength = 20,
    outputMode = 'code'
) {
    const re = new RegExp(searchTerm, 'i');
    const fragments = text.split(re);

    const str = fragments.map((fragment, index) => {

        // No search term after the last fragment
        // if (index === fragments.length - 1) {
        //     return fragment; 
        // }
        if (index < fragments.length - 1) {

            let leftBuff = fragment.slice(-bufferLength);
            let rightBuff = fragments[index + 1].slice(0, bufferLength);

            if (outputMode === 'console') {
                leftBuff = styleText('white', leftBuff);
                startTag = styleText('grey', startTag);
                searchTerm = styleText('yellow', searchTerm);
                endTag = styleText('grey', endTag);
                rightBuff = styleText('white', rightBuff);
            }

            return `${leftBuff}${startTag}${searchTerm}${endTag}${rightBuff}`;
        }
    }).filter(fragment => fragment).join(' … ');

    return `${str}`;
}

export { removeStopWords, cleanText, mySnippet }