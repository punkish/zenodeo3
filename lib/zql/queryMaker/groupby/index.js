export const getGroupBy = ({ resource, params }) => {
    
    if ('groupby' in params) {
        return params.groupby;
    }

    return 'images."id"'
    
}