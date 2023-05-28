export const getLimitAndOffset = ({ resource, params }) => {
    return {
        limit: params.size,
        offset: (params.page - 1) * params.size
    }
}