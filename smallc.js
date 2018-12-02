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

fs.readFile(process.argv[2], 'utf8', (err, input) => {

    if (err) {
        throw err;
    }

    // add tokens to escape characters used during lex parse
    const tokensWithEscapes = [
        {
            "name": "colon",
            "pattern": "[:]"
        },
        {
            "name": "openingSharpBrace",
            "pattern": "[<]"
        },
        {
            "name": "closingSharpBrace",
            "pattern": "[>]"
        }
    ].concat(tokens)
    // add wildcard match against everything that was not parsed
    .concat([
        "name": "invalid",
        "pattern": ".*"
    ]);

    // initialize lex state
    var currentState = [ input ];

    tokensWithEscapes.forEach(tokenType => {

        // construct regex
        tokenType.regex = new RegExp(`(${tokenType.pattern})`, 'g');

        currentState = currentState.map(sequence => {
            if (typeof sequence == 'string') {
                // replace with parsed out tokens
                const parsedSequence = sequence.replace(tokenType.regex, `<${tokenType.name}:$1>`);
                return parsedSequence
                // split on splits
                .split(/><|>|</)
                // drop empty strings
                .filter(str => str !== '')
                // replace with constructed token objects
                .map(chunk => {
                    const match = chunk.match(/^(.*)\:(.*)$/);
                    if (match) {
                        return {
                            type: match[1],
                            text: match[2]
                        };
                    } else {
                        return chunk;
                    }
                })
            } else {
                return sequence;
            }
        })
        // flatten arrays
        .reduce((acc, val) => {
            if (!Array.isArray(val)) {
                return acc.concat([ val ]);
            } else {
                return acc.concat(val);
            }
        }, []);
    });

    // now the lex is complete and we can go to syn
    const tokenStream = currentState;
    const stack = [];

    tokenStream.forEach(token => {
        
    });
    
});