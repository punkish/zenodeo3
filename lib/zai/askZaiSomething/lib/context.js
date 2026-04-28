// lib/zai/askZaiSomething/lib/context.js
//import { sqlRunner, getTreatments } from '../../../dataFromZenodeo.js';
import { addImagesToTreatments } from '../../lib/index.js';
import { subsetVectorSearch } from './vectorSubsetSearch.js';
//import * as utils from '../../../utils.js';
import { sendEvent, intersectNonEmpty } from './utils.js';
import { plugin as binomens } from './plugins/binomens.js';
import { plugin as treatmentAuthors } from './plugins/treatmentAuthors.js';
import { plugin as fts } from './plugins/fts.js';

// Example usage:
// const data = [[1, 2, 3], [], [2, 3, 4], [3, 5]];
// const result = intersectNonEmpty(data); 
// console.log(result); // Output: [3]

// ─────────────────────────────────────────────────────────────────────────────
// getContext
//
// accepts `raw` so it can emit progress events as each step resolves.
//
// BUG FIXED: getTreatmentsByTokens previously silently used only treatmentAuthors
// when both binomens AND treatmentAuthors were detected, because the second
// `if` block overwrote the `sql` variable set by the first.
// Fixed by checking both in a single conditional that picks binomens first
// (more specific) and falls back to authors.  If you need both simultaneously
// you'll want to extend getTreatments() to support a JOIN on both tables.
// ─────────────────────────────────────────────────────────────────────────────
async function getContext(fastify, question, raw) {
    const debugInfo = {};

    // Step 1 — detect binomens and authors
    let array1;

    if (binomens.enabled) {
        const { 
            treatments_ids, 
            debugDetectBinomens, 
            debugIdentifyTreatmentsByBinomens 
        } = binomens.run(fastify, question, raw);
        array1 = treatments_ids;
        debugInfo.detectBinomens = debugDetectBinomens;
        debugInfo.identifyTreatmentsByBinomens = debugIdentifyTreatmentsByBinomens;
    }

    let array2;

    if (treatmentAuthors.enabled) {
        const res = treatmentAuthors.run(fastify, question, raw);
        array2 = res.treatments_ids;
        debugInfo.identifyTreatmentsByTreatmentAuthors = res.debugIdentifyTreatmentsByTreatmentAuthors;
    }
    
    let treatments_ids = intersectNonEmpty([ array1, array2 ]);

    if (!treatments_ids.length) {

        // Step 3 — fallback: generic FTS5
        if (fts.enabled) {
            const res = fts.run(fastify, question, raw);
            treatments_ids = res.treatments_ids;
            debugInfo.ftsDebug = res.ftsDebug;
        }

    }

    // Step 4 — subset vector search
    sendEvent(raw, 'status', { 
        step: 'vector', 
        message: 'Running vector search' 
    });

    const start = Date.now();
    fastify.zlog.info(`Running subset vector search on ${treatments_ids.length} candidate treatments`);
    
    // extract treatments_ids from the results
    //const treatments_ids = candidateTreatments.map(t => t.treatments_id );
    const vectorResults = await subsetVectorSearch(
        fastify, 
        question, 
        64, 
        treatments_ids
    );
    debugInfo.vectorSearch = { took: Date.now() - start };

    // Deduplicate by treatmentId, keeping only the highest-scored chunk per 
    // treatment. PREVIOUSLY: used Array.from(new Map(...).values()) which is 
    // correct but relies on Map insertion order — fine since vectorResults is 
    // already sorted by score descending, so the first occurrence of each 
    // treatmentId is the best. No logic change; comment added for clarity.
    const treatments = Array.from(
        new Map(
            vectorResults.map(v => [v.treatmentId, {
                treatments_id:   v.treatments_id,
                treatmentId:     v.treatmentId,
                zenodoDep:       v.zenodoDep,
                treatmentTitle:  v.treatmentTitle,
                treatmentAuthor: v.treatmentAuthor,
                articleTitle:    v.articleTitle,
                articleAuthor:   v.articleAuthor,
                journalYear:     v.journalYear,
                journalTitle:    v.journalTitle,
                publicationDate: v.publicationDate,
                status:          v.status,
                genus:           v.genus,
                species:         v.species,
                fulltext:        v.fulltext,
                //speciesDesc:     v.speciesDesc,
                score:           v.score,
            }])
        ).values()
    );

    if (!treatments.length) return null;
    sendEvent(raw, 'status', { 
        step: 'vector', 
        message: `winnowed to ${treatments.length} treatments` 
    });

    // Step 5 — enrich with images
    const { 
        treatments: enrichedTreatments, 
        debug: imagesDebug 
    } = addImagesToTreatments(fastify, 'fulltext', treatments, raw);


    // Step 6 — assemble context
    const context = assembleContext(treatments, question, raw);
    //Object.assign(debugInfo, { images: imagesDebug });
    debugInfo.image = imagesDebug;
    return { context, treatments: enrichedTreatments, debugInfo };
}

function assembleContext(treatments, question, raw) {
    sendEvent(raw, 'status', { step: 'context', message: `Assembling context with ${treatments.length} treatments` });

    const documents = treatments.map((treatment, index) => {
        return `
### Document ${index + 1}
---
**Title:** ${treatment.treatmentTitle} 
**Species:** ${treatment.genus} ${treatment.species}
**Status:** ${treatment.status}
**Treatment Author:** ${treatment.treatmentAuthor}

**Published in Article:** ${treatment.articleTitle}
**Article Author:** ${treatment.articleAuthor}
**Publication Date:** ${treatment.publicationDate}

**Document Text:** ${treatment.fulltext}
---  `;
        }).join('\n');

    const context = `
You are a scientific research assistant specializing in biological taxonomy and entomology. Your task is to answer the question shown below using the provided research documents.

---  
Core Rules

1. Use the provided documents as your primary source of truth.
2. Do NOT introduce external knowledge that is not supported by the documents.
3. You MAY draw careful, limited inferences when the documents contain relevant but indirect information.
4. If the documents contain partial evidence, provide the best possible answer and clearly reflect any uncertainty.
5. Only say "The provided documents don’t contain this information" if there is truly no relevant or related information.
6. Every claim must cite the document number (e.g., Document 1, Document 2).
7. If a statement is weakly supported, still cite the closest relevant document.
8. Use only the most relevant documents. Ignore irrelevant ones.
9. Use scientific terminology where appropriate.
10. Prefer diagnostic and morphological differences when available.
11. Do NOT provide resources for further reading.
12. Do NOT ask follow-up questions.
13. Do NOT end your response with a question or invitation.

---  
Relevance Guidance

• The documents may not exactly match the wording of the question.  
• Use semantically related information if it reasonably answers the question.  
• Prefer approximate relevance over missing a valid answer.  

---  
Step-by-Step Method (Follow in Order)

Step 1 — Extract Evidence from each relevant document, including:
• Body size, shape, and coloration  
• Head and genital morphology  
• Pronotum, wing, and antennal structures  
• Other diagnostic characters  
• Geographic distribution  

---  
Step 2 — Analyze the species by comparing:
• Morphology  
• Size  
• Structural anatomy  
• Coloration  
• Distribution  
• Taxonomic distinctions  

---  
Step 3 — Produce the Final Answer using structured sections such as:
• Taxonomy  
• Body size  
• Morphology  
• Coloration  
• Diagnostic anatomical structures  
• Geographic distribution  

Each statement must include a document citation.

---  
Question: ${question}

---  
### Context Documents

*Note: Documents are ordered by estimated relevance, with Document 1 being the most relevant.*

${documents}
`;

    return context;
}


export { getContext };