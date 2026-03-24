import { styleText } from 'node:util';
import { sqlRunner } from '../../dataFromZenodeo.js';
import { formatSql } from '../../utils.js';

// We don"t have stopwords of one or two letters because those are 
// filtered out automatically
const stopwords = [
    /* a */ "able", "about", "above", "ain't", "all", "and", "any", 
            "are", "aren't",
    /* b */ "because", "but", 
    /* c */ "can", "cannot", "could", "couldnt",
    /* d */ "describe", "did", "does", "dont",
    /* e */ "either", "else", "ever", "every",
    /* f */ "for", "from",
    /* g */ "get", "got",
    /* h */ "had", "hadnt", "has", "hasnt", "have", "havent", "her", 
            "hers", "him", "his", "how", "however",
    /* i */ "into", "isnt", "its",
    /* j */ "just",
    /* k */ 
    /* l */ "let", "like", "likely",
    /* m */ "may", "might", "most", "must", 
    /* n */ "nor", "not",
    /* o */ "off", "only", "other", "our", "own", 
    /* p */ 
    /* q */ 
    /* r */ 
    /* s */ "shall", "should", "shouldnt", "since", "so", "some",
    /* t */ "than", "that", "the", "them", "then", "there", "their", 
            "they", "this", "tis", "too", "twas",
    /* u */ "unto", "upon", "use", "used", "using", "useful", "uses", 
            "using", "usually",
    /* v */ "very", "viz",
    /* w */ "want", "wants", "was", "wasnt", "way", "went", "were", 
            "weren't", "we'd", "well", "we'll", "we're", "we've", "what", 
            "what's", "whatever", "whence", "whenever", "where", "whereafter", 
            "whereas", "whereby", "wherein", "whereupon", "wherever", 
            "whether", "when", "which", "while", "whither", "who", "whose", 
            "whoever", "whole", "whom", "why", "will", "willing", "wish", 
            "with", "within", "without", "won't", "would", "wouldn't",
    /* x */ 
    /* y */ "yes", "yet", "you", "your", "you'd", "you're", "you'll",
            "you've", "yours", "yourself", "yourselves",
    /* z */ 
];

// https://www.calculators.org/math/html-punctuation.php

const punctuations = {
    replaceWithSpace: [
        /* percent           */ '%',
        /* colon             */ ':',
        /* semicolon         */ ';',
        /* comma             */ ',', 
        /* period            */ '\\.', 
        /* dash              */ '-',
        /* m-dash            */ ' — ', 
        /* n-dash            */ '–',
        /* m-dash            */ '—',
        /* n-dash            */ '_',
        /* underscore        */ '_',
        /* close doublequote */ '"',
        /* open doublequote  */ '“',
        /* exclamation       */ '!', 
        /* slash             */ '\/',
        /* newline           */ '\\n',
        /* question          */ '\\?', 
        /* open paren        */ '\\(', 
        /* close paren       */ '\\)', 
        /* open curly        */ '\\{', 
        /* close curly       */ '\\}', 
        /* open square       */ '\\[', 
        /* close square      */ '\\]',
        /* asterisk          */ '\\*',
        /* hash              */ '#',
        /* at                */ '@',
        /* dollar            */ '$',
        /* numbers           */ '[0-9]'
    ],

    remove: [
        /* apostrophe */ '’', 
    ]
}

const replaceWithSpace = new RegExp(
    punctuations.replaceWithSpace.join('|'), 'g'
);

const remove = new RegExp(
    punctuations.remove.join('|'), 'g'
);

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

function addImagesToTreatments(fastify, removeField, treatments) {
    const sql = `
        SELECT httpUri, captionText
        FROM images
        WHERE treatments_id = @treatments_id
    `;
    const imagesDebug = {};

    const enrichedTreatments = treatments.map(treatment => {
        const { [removeField]: _, ...rest } = treatment;
        const runparams = { treatments_id: treatment.treatments_id };
        const { result, runtime } = sqlRunner(fastify, sql, runparams, 'all');

        imagesDebug[treatment.treatmentId] = { 
            sql: formatSql(sql, runparams), 
            runtime 
        };
        return { ...rest, images: result };
    });

    return { treatments: enrichedTreatments, debug: imagesDebug };
}

export { addImagesToTreatments, removeStopWords, cleanText, mySnippet, replaceWithSpace, remove }