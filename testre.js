'use strict';

const op1 = '(?<op1>within)';
const op2 = '(?<op2>contained_in)';
const num = '[-+]?[0-9]+\.?[0-9]+';
const int = '[0-9]+';
const qot = `['"]`;
const spc = ' *';
const opp = '\\(';
const clp = '\\)';
const opc = '\\{';
const clc = '\\}';

const rad = `radius:(?<r>${int}),${spc}`;
const unt = `units:${qot}(?<u>kilometers|miles)${qot},${spc}`;
const pnt = `lat:(?<lat>${num}),${spc}lng:(?<lng>${num})${spc}`;
const cn1 = `${op1}${opp}${rad}${unt}${pnt}${clp}`;

const llf = `lower_left:${opc}lat:(?<minlat>${num}),${spc}lng:(?<minlng>${num})${clc}${spc}`;
const upr = `upper_right:${opc}lat:(?<maxlat>${num}),${spc}lng:(?<maxlng>${num})${clc}${spc}`;
const cn2 = `${op2}${opp}${llf},${spc}${upr}${clp}`;


let pattern = `^${cn1}|${cn2}$`;

const input1 = "within(radius:30,units:'kilometers',lat:20.1,lng:-120.32)";
const input2 = "contained_in(lower_left:{lat:20.1,lng:-120.32},upper_right:{lat:20.1,lng:-120.32})";

const re = new RegExp(pattern);
const m1 = input1.match(re);
console.log(m1.groups);
const m2 = input2.match(re);
console.log(m2.groups);