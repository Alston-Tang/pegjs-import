'use strict';

const fs = require('fs'),
    path = require('path'),
    peg = require('pegjs'),
    importPlugin = require('./lib/compiler-plugin'),
    parseImports = require('./lib/parse-imports');

const parsers = {},
    importStack = [];

function generate(filename, options, rootFileName) {

    // if we've already imported this file, don't touch it again
    if (parsers[filename]) {
        return parsers[filename];
    }

    const absoluteFilename = path.resolve(filename),
        grammar = parseImports(absoluteFilename);

    if (importStack.indexOf(absoluteFilename) !== -1) {
        throw new peg.GrammarError('Circular dependency on ' + absoluteFilename);
    } else {
        importStack.push(absoluteFilename);
    }

    // recursively build the files we discovered
    grammar.dependencies.forEach(function (dependency) {

        // convert path to absolute
        if (dependency.path.charAt(0) === '.') {

            const prospectivePath = path.resolve(
                path.dirname(filename),
                dependency.path);

            if (fs.existsSync(path.join(prospectivePath, 'index.peg'))) {
                dependency.path = path.join(prospectivePath, 'index.peg');
            } else if (fs.existsSync(prospectivePath + '.peg')) {
                dependency.path = prospectivePath + '.peg';
            } else if (fs.existsSync(prospectivePath)) {
                dependency.path = prospectivePath;
            }

        } else {
            dependency.path = require.resolve(dependency.path);
        }

        let parser = null;
        try {
            parser = generate(dependency.path, options, rootFileName);
        } catch (e) {
            if (e instanceof peg.GrammarError) {
                throw new peg.GrammarError(dependency.path + ': ' + e.message + '\n');
            } else {
                throw e;
            }
        }

    });

    // call out to PEG and build the parser

    const combinedOptions = {};
    for (let option in options) {

        if (options.hasOwnProperty(option)) {
            combinedOptions[option] = options[option];
        }

    }

    // overwrite output if it is not the root file
    if (filename !== rootFileName) {
        options['output'] = 'parser';
    }

    if (combinedOptions.plugins) {
        combinedOptions.plugins = combinedOptions.plugins.concat(importPlugin);
    } else {
        combinedOptions.plugins = [importPlugin];
    }

    combinedOptions.filename = absoluteFilename;
    combinedOptions.dependencies = grammar.dependencies;

    let newParser = null;

    try {
        newParser = peg.generate(grammar.text, combinedOptions);
    } catch (e) {

        if (e instanceof peg.GrammarError) {
            throw new peg.GrammarError(absoluteFilename + ': ' + e.message + '\n');
        } else {
            throw e;
        }

    }

    // pop ourselves off the import stack
    importStack.pop();

    parsers[absoluteFilename] = newParser;
    return newParser;

}

module.exports = {generate: generate};
