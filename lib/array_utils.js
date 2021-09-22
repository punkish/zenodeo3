'use strict'

// class A {
//     constructor() {
//         this.value = value
//     }

//     intersect() {
//         const arrays = [...this.value]
//         this.value = arrays[0].filter(v => arrays[1].includes(v))
//         return this
//     }

//     uniq() {
//         const value = this.value
//         this.value = [...new Set(value)]
//         return this
//     }
// }


const intersect = (...args) => {
    return args.reduce((a, b) => a.filter(c => b.includes(c)))
}

const uniq = (array) => {
    return [...new Set(array)]
}

const one = [1,2,3,1,3,-5]
const two = [2,3,4,5,5,1,1,1,4]

// const a = new A()
// console.log(a.intersect(one, two))
// console.log(a.intersect(one, two).uniq())

console.log(intersect(one, two))
console.log(uniq(two))