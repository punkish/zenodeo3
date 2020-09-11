'use strict'

module.exports = {

    // uuid, well, at least the kind the treatment bank uses
    id: { type: 'string', maxLength: 32, minLength: 32 },
    text: { type: 'string' },
    bool: { type: 'integer' },
    int: { type: 'integer' }
}