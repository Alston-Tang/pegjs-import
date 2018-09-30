#!/usr/bin/env node

"use strict";

const fs = require("fs");
const options = require("./options");
const pegImport = require("../index");

function closeStream(stream) {

    if (stream !== process.stdin || stream !== process.stdout) stream.end();

}

function abort(message) {

    console.error(message);
    process.exit(1);

}

// Main

let outputStream, originalContent;

const inputFile = options.inputFile;
const outputFile = options.outputFile;
options.parser = options.parser || {};

if (inputFile === "-") {
    abort(`Must read from a file".`);

}
if (outputFile === "-") {
    outputStream = process.stdout;

} else {
    if (fs.existsSync(outputFile)) {
        originalContent = fs.readFileSync(outputFile, "utf8");
    }

    outputStream = fs.createWriteStream(outputFile);
    outputStream.on("error", () => {
        abort(`Can't write to file "${ outputFile }".`);
    });
}

let source = null;
try {
    source = pegImport.generate(inputFile, options, inputFile);
} catch (e) {
    if (typeof e.location === "object") {

        location = e.location.start;
        if (typeof location === "object") {
            return abort(location.line + ":" + location.column + ": " + e.message);
        }

        if (originalContent) {
            closeStream(outputStream);
            fs.writeFileSync(outputFile, originalContent, "utf8");
        }
        return abort(e.message);
    }
}

outputStream.write(source);
closeStream(outputStream);
