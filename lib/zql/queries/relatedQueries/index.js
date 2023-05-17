import * as zu from '../../z-utils.js';

export const relatedQueries = ({ resource, params }) => {

    // validated params are different from the params submitted to validate()
    params = zu.validate({ resource, params });

    // if validation failed, no params are returned, so return false
    if (!params) {
        return false;
    }

    return mainQueries({ resource, params });
}