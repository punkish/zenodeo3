export const getGroupBy = ({ resource, params }) => {
    
    // if (resource === 'images') {
    //     return 'images.id'
    // }

    if (params.groupby) {
        return params.groupby;
    }
    
}