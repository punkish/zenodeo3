'use strict'

const re = {
    date: '\\d{4}-\\d{1,2}-\\d{1,2}',
    year: '^\\d{4}$',
    real: '((\\+|-)?(\\d+)(\\.\\d+)?)|((\\+|-)?\\.?\\d+)'
}

const pattern = `^within\\(radius:\\s*(?<radius>\\d+\\.\\d+),\\s*units:\\s*(?<units>kilometers|miles),\\s*lat:\\s*(?<lat>${re.real}),\\s*lng:(?<lng>${re.real})\\)$`

const str = 'within(radius:50.09, units: kilometers, lat:-25.6532, lng:-3.48)'

const res = str.match(pattern)
console.log(res)

