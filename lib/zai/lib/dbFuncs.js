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
    str, 
    searchTerm, 
    bufferLength = 20,
    outputMode = 'code',
    startTag = '<span class="hilite">', 
    endTag = '</span>', 
    joinWith = '\n'
) {
    if (!str || !searchTerm) return '';

    const regex = new RegExp(`\\b${searchTerm}\\b`, 'gi');
    
    const results = str.split(/\n/).map((line, i) => {
        line = line.trim();
        const match = regex.exec(line);

        while (match) {            
            const startIdx = Math.max(0, match.index - bufferLength);
            const endIdx = Math.min(
                line.length, 
                match.index + searchTerm.length + bufferLength
            );

            let before = line.slice(startIdx, match.index);
            let after = line.slice(match.index + searchTerm.length, endIdx);
            let term = match[0];

            if (outputMode === 'console') {
                before = styleText('white', before);
                startTag = styleText('grey', startTag);
                term = styleText('yellow', term);
                endTag = styleText('grey', endTag);
                after = styleText('white', after);
            }

            return `${before}${startTag}${term}${endTag}${after}`;
        }
    }).filter(line => line !== undefined);
   
    return results.length ? results.join(joinWith) : '';
}

export { removeStopWords, cleanText, mySnippet }