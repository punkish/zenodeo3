export function getLimitAndOffset(resource, request) {

    const page = request.query.page <= 1 ? 1 : request.query.page;

    return {
        limit: request.query.size,
        offset: (page - 1) * request.query.size
    }
}