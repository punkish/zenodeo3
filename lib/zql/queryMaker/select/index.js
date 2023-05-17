const getSelect = ({ resource, params }) => {
    let columns;
    const cols = ddutils.getParams(resource);

    if (params.cols) {
        
        // Simplest code for array intersection in javascript
        // https://stackoverflow.com/a/1885569/183692
        columns = cols
            .filter(col => params.cols.includes(col.name) || col.isResourceId)
            .map(col => col.selname);
    }
    else {
        const colIsResourceId = cols.filter(col => col.isResourceId)[0];
        columns = [ colIsResourceId.selname ];
    }

    return columns;
}