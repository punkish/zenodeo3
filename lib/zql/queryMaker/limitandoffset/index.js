export const getLimitAndOffset = ({ params }) => {

    const page = params.page <= 1
        ? 1
        : params.page;

    return {
        limit: params.size,
        offset: (page - 1) * params.size
    }
}