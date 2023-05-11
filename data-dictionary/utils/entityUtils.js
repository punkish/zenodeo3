import { tables } from '../resources/index.js';
import { resources } from '../resources/index.js';

/**
 * A simple cache for data-dictionary queries.
 * The cache is used only for methods whose arg is 'resource' 
 */ 
const D = {};

const getEntity = (entityName, typeOfEntity = 'resource', property) => {

    if (!entityName) {
        console.error(`Error: required argument "${typeOfEntity}Name" missing`);
        return;
    }

    const entity = typeOfEntity === 'resource'
        ? resources.filter(r => r.name === entityName)[0]
        : tables.filter(t => t.name === entityName)[0];

    // check the cache for table or initialize it
    if (!(typeOfEntity in D)) D[typeOfEntity] = {};
    if (!(entityName in D[typeOfEntity])) D[typeOfEntity][entityName] = {};

    if (property) {

        if (!(property in D[typeOfEntity][entityName])) {
            D[typeOfEntity][entityName][property] = entity[property] || false;
        }

        return D[typeOfEntity][entityName][property];

    }
    else {
        return entity;
    }
}

export { getEntity }