
'use strict';

const pegimport = require('../../index'),
  peg = require('pegjs');

describe('peg-import', function() {

  it('provides the basic import syntax', function() {

    let parser;

    parser = pegimport.generate('test/fixtures/import.peg');

    expect(function() {
      parser.parse('0123456789');
    }).not.to.throw();

    expect(function() {
      parser.parse('0123456789.');
    }).not.to.throw();

    expect(function() {
      parser.parse('abcdefghijk');
    }).to.throw(parser.SyntaxError);

  });

  it('only imports initializers once', function() {

    expect(function() {
      pegimport.generate('test/fixtures/initializer.peg');
    }).not.to.throw();

  });

  it('imports initializers in the correct order', function() {

    expect(function() {
      pegimport.generate('test/fixtures/initializer2.peg');
    }).not.to.throw();

  });

  it('detects circular dependencies', function() {

    expect(function() {
      pegimport.generate('test/fixtures/circle/left.peg');
    }).to.throw(peg.GrammarError);

  });

  it('passes options straight through', function() {

    expect(function() {
      pegimport.generate('test/fixtures/initializer.peg', { optimize: 'size' });
    }).not.to.throw();

  });

  it('treats internal rule name references correctly', function() {

    expect(function() {
      pegimport.generate('test/fixtures/rulerefs.peg');
    }).not.to.throw();

  });

});
