export const getOrderBy = ({ params }) => {
    
    if ('sortby' in params) {
        const orderby = params.sortby.split(',').map(o => {
            o = o.trim();
            const arr = o.split(/:/);

            if (arr) {
                return `${arr[0]} ${arr[1].toUpperCase()}`;
            }
        })

        return orderby;
    }
    
}