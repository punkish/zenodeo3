export const getGroupBy = ({ resource, params }) => {
    
    if (resource === 'images') {
        return 'images."id"'
    }

    if ('groupby' in params) {
        return params.groupby;
    }
    
}