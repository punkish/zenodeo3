export const getOrderBy = (resource, request) => {
    
    if ('sortby' in request.query) {
        const orderby = request.query.sortby.split(',').map(o => {
            o = o.trim();
            const arr = o.split(/:/);

            if (arr) {
                return `${arr[0]} ${arr[1].toUpperCase()}`;
            }
        })

        return orderby;
    }
    
}