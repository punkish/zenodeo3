export const getGroupBy = (resource, request) => {
    
    // if (resource.name === 'images') {
    //     return 'images.id'
    // }

    if (request.query.groupby) {
        return request.query.groupby;
    }
    
}