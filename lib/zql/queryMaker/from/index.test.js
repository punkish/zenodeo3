import tap from 'tap';
import { getFrom } from './index.js';

const tests = [
    {
        input: {
            resource: 'treatments',
            params: {
                q: 'agosti',
                treatmentTitle: 'Biodiversity'
            }
        },
        wanted: [
            'treatments',
            'JOIN treatmentsFts ON treatments.id = treatmentsFts.rowid'
        ]
    },
    {
        input: {
            resource: 'treatments',
            params: {
                checkinTime: 'since(2020-12-12)',
                cols: 'treatmentTitle'
            }
        },
        wanted: [
            'treatments'
        ]
    },
    {
        input: {
            resource: 'treatments',
            params: {
                biome: 'pampas',
                cols: 'treatmentTitle'
            }
        },
        wanted: [
            'treatments',
            'JOIN materialCitations ON treatments.id = materialCitations.treatments_id',
            'JOIN geodata.biome_synonyms ON materialCitations.biomes_id = geodata.biome_synonyms.biomes_id'
        ]
    },
    {
        input: {
            resource: 'biomes',
            params: {
                biome: 'pampas'
            }
        },
        wanted: [
            'geodata.biomes',
            'JOIN biome_synonyms ON biomes.id = biome_synonyms.biomes_id'
        ]
    }
];


tap.test('order by', tap => {
    tests.forEach(test => {
        const found = getFrom(test.input);
        tap.same(found, test.wanted);
    });

    tap.end();
});