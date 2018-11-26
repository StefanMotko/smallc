#!/usr/bin/env node
const fs = require('fs');
const tokens = require('./tokens.json');

if (process.argv.length != 3) {
    console.log(`   smallc - SMALL language compiler
    Usage:
        smallc <file>
        
    <file>  file to compile`);
    // exit succesfully with no args, error on multiple args
    process.exit(process.argv.length == 2 ? 0 : 1);
}

fs.readFile(process.argv[2], (err, input) => {

    if (err) {
        throw err;
    }

    tokens.map(token => new RegExp(token.pattern));


});