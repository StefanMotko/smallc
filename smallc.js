#!/usr/bin/env node
const fs = require('fs');
const tokens = require('./tokens.json');
const parseTable = require('./parseTable.json');

if (process.argv.length != 3 && (process.argv.length != 4 || process.argv[2] != '--step')) {
    console.log(`   smallc - SMALL language analyser
    Usage:
        smallc [--step] <file>
        
    <file>  file to compile`);
    // exit succesfully with no args, error on multiple args
    process.exit(process.argv.length == 2 ? 0 : 1);
}

const step = process.argv.length == 4 && process.argv[2] == '--step';

fs.readFile(process.argv[process.argv.length - 1], 'utf8', (err, input) => {

    if (err) {
        throw err;
    }

    // add wildcard match against everything that was not parsed
    const tokensWithInvalid = tokens.concat([
        {
            "name": "invalid",
            "pattern": ".*|[\r\n]"
        }
    ]);

    // initialize lex state
    var currentState = [ input ];

    tokensWithInvalid
    .forEach(tokenType => {

        currentState = currentState.map(sequence => {
            if (typeof sequence == 'string') {
                // split out with token regexes
                return sequence.split(new RegExp(`(${tokenType.pattern})`, 'g'))
                // construct token objects
                .map((chunk, index, array) => {
                    if (index % 2 == 1) {
                        return {
                            type: tokenType.name,
                            text: chunk
                        };
                    } else {
                        return chunk;
                    }
                })
                // drop empty strings
                .filter(str => str !== '');
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

    if (step) {
        console.log(`Tokens: ${JSON.stringify(currentState)}`);
    }

    // now the lex is complete and we can go to syn
    const tokenStream = currentState;
    const stack = [];
    stack.push(parseTable.startingSymbol);

    function isTerminal(token) {
        return token[0] == token[0].toLowerCase();
    }

    var errors = [];
    var panic = false;
    var error = false;
    var unexpectedText = '';
    tokenStream.forEach(token => {
        if (step) {
            console.log(`\nCurrent token: ${JSON.stringify(token)}`);
        }

        if (parseTable.skipSymbols.indexOf(token.type) == -1 || panic) {

            var foundTerminal = false;
            while (!foundTerminal) {
                if (step) {
                    console.log(`Stack: ${JSON.stringify(stack)}`);
                }

                const top = stack[stack.length - 1];

                if (top == token.type) {
                    foundTerminal = true;
                    if (step) {
                        console.log(`> Matched token ${JSON.stringify(top)} on top of stack`);
                    }
                    
                    stack.pop();
                } else if (!top || isTerminal(top)) {
                    // incorrect terminal
                    panic = true;
                    error = true;
                    unexpectedText = `${unexpectedText}${token.text}`;
                    if (step) {
                        console.log(`> Unexpected token ${JSON.stringify(token.text)}`);
                    }
                    break;
                } else {
                    const ruleResult = parseTable.symbols[top][token.type];
                    if (!ruleResult) {
                        // incorrect terminal
                        panic = true;
                        error = true;
                        unexpectedText = `${unexpectedText}${token.text}`;
                        if (step) {
                            console.log(`> Unexpected token ${JSON.stringify(token.text)}`);
                        }
                        break;
                    } else {
                        if (step) {
                            console.log(`> Executing rule ${top} -> ${JSON.stringify(ruleResult)}`);
                        }
                        
                        stack.pop();
                        stack.push(...([].concat(ruleResult).reverse()));
                    }
                }
                
                if (panic) {
                    console.error(`Unexpected input: expected ${top || 'EOF'} but found ${unexpectedText}`);
                    unexpectedText = '';
                    panic = false;
                }

            }

        } else if (step) {
            console.log("Skipping token");
        }

    });

    if (panic) {
        console.error(`Unexpected input: expected ${stack[stack.length - 1] || 'EOF'} but found ${unexpectedText}`);
        panic = false;
        unexpectedText = '';
    }
    if (error) {
        process.exit(1);
    } else {
        process.exit(0);
    }
    
});