'use strict';

module.exports = function amedBraceStyleRule(context) {
  var OPEN_MESSAGE = 'Opening curly brace does not appear on the same line ' +
    'as controlling statement.';
  var BODY_MESSAGE = 'Statement inside of curly braces should be on next line.';
  var CLOSE_MESSAGE = 'Closing curly brace does not appear on the same line ' +
    'as the subsequent block.';
  var CLOSE_MESSAGE_SINGLE = 'Closing curly brace should be on the same line ' +
    'as opening curly brace or on the line after the previous block.';
  var MULTILINE_IF_NEXT_LINE_CURLY = 'Multiline if statement must have ' +
    'opening curly brace on the next line';

  //--------------------------------------------------------------------------
  // Helpers
  //--------------------------------------------------------------------------

  /**
   * Determines if a given node is a block statement.
   * @param {ASTNode} node The node to check.
   * @returns {boolean} True if the node is a block statement, false if not.
   * @private
   */
  function isBlock(node) {
    return node && node.type === 'BlockStatement';
  }

  /**
   * Check if the token is an punctuator with a value of curly brace
   * @param {object} token - Token to check
   * @returns {boolean} true if its a curly punctuator
   * @private
   */
  function isCurlyPunctuator(token) {
    return token.value === '{' || token.value === '}';
  }

  /**
   * Binds a list of properties to a function that verifies that the opening
   * curly brace is on the same line as its controlling statement of a given
   * node.
   * @param {...string} The properties to check on the node.
   * @returns {Function} A function that will perform the check on a node
   * @private
   */
  function checkBlock() {
    var blockProperties = arguments;

    return function _checkBlock(node) {
      [].forEach.call(blockProperties, function checkBlockForProp(blockProp) {
        var block = node[blockProp];
        var previousToken;
        var curlyToken;
        var curlyTokenEnd;
        var curlyTokensOnSameLine;

        if (isBlock(block)) {
          previousToken = context.getTokenBefore(block);
          curlyToken = context.getFirstToken(block);
          curlyTokenEnd = context.getLastToken(block);
          curlyTokensOnSameLine =
            curlyToken.loc.start.line === curlyTokenEnd.loc.start.line;

          if (ifStatementIsMultilineAndCurlyOnSeparateLine(node)) {
            var consequentFirstToken = context.getFirstToken(node.consequent);
            if (consequentFirstToken.loc.start.line !== node.test.loc.end.line + 1) {
              context.report(node, MULTILINE_IF_NEXT_LINE_CURLY);
            }
          }
          if (previousToken.loc.start.line !== curlyToken.loc.start.line &&
            !ifStatementIsMultilineAndCurlyOnSeparateLine(node)) {
            context.report(node, OPEN_MESSAGE);
          } else if (block.body.length > 0) {
            if (curlyToken.loc.start.line === block.body[0].loc.start.line && !curlyTokensOnSameLine) {
              context.report(block.body[0], BODY_MESSAGE);
            } else if (curlyTokenEnd.loc.start.line === block.body[block.body.length - 1].loc.start.line && !curlyTokensOnSameLine) {
              context.report(block.body[block.body.length - 1], CLOSE_MESSAGE_SINGLE);
            }
          } else if (block.body.length && curlyToken.loc.start.line === block.body[0].loc.start.line) {
            context.report(block.body[0], BODY_MESSAGE);
          }
        }
      });
    };
  }

  function checkForInStatement(node) {
    var block = node.body, previousToken, curlyToken, curlyTokenEnd, curlyTokensOnSameLine;

    if (isBlock(block)) {
      previousToken = context.getTokenBefore(block);
      curlyToken = context.getFirstToken(block);
      curlyTokenEnd = context.getLastToken(block);
      curlyTokensOnSameLine = curlyToken.loc.start.line === curlyTokenEnd.loc.start.line;

      if (previousToken.loc.start.line !== curlyToken.loc.start.line) {
        context.report(node, OPEN_MESSAGE);
      } else if (block.body.length) {
        if (curlyToken.loc.start.line === block.body[0].loc.start.line
        && !curlyTokensOnSameLine && block.body[0].type !== 'IfStatement') {
          context.report(block.body[0], BODY_MESSAGE);
        } else if (curlyTokenEnd.loc.start.line === block.body[block.body.length - 1].loc.start.line && !curlyTokensOnSameLine) {
          context.report(block.body[block.body.length - 1], CLOSE_MESSAGE_SINGLE);
        }
      } else if (block.body.length && curlyToken.loc.start.line === block.body[0].loc.start.line) {
        context.report(block.body[0], BODY_MESSAGE);
      }
    }
  }

  function ifStatementIsMultilineAndCurlyOnSeparateLine(node) {
    return node.type === 'IfStatement' &&
      node.test.loc.start.line < node.test.loc.end.line;
  }

  /**
   * Enforces the configured brace style on IfStatements
   * @param {ASTNode} node An IfStatement node.
   * @returns {void}
   * @private
   */
  function checkIfStatement(node) {
    var tokens,
      alternateIsBlock = false,
      alternateIsIfBlock = false;

    checkBlock('consequent', 'alternate')(node);

    if (node.alternate) {
      alternateIsBlock = isBlock(node.alternate);
      alternateIsIfBlock = node.alternate.type === 'IfStatement'
        && isBlock(node.alternate.consequent);

      if (alternateIsBlock || alternateIsIfBlock) {
        tokens = context.getTokensBefore(node.alternate, 2);

        if (tokens[0].loc.start.line !== tokens[1].loc.start.line
          && isCurlyPunctuator(tokens[0]))
        {
          context.report(node.alternate, CLOSE_MESSAGE);
        }
      }
    }
  }

  /**
   * Enforces the configured brace style on TryStatements
   * @param {ASTNode} node A TryStatement node.
   * @returns {void}
   * @private
   */
  function checkTryStatement(node) {
    var tokens;

    checkBlock('block', 'finalizer')(node);

    if (isBlock(node.finalizer)) {
      tokens = context.getTokensBefore(node.finalizer, 2);
      if (tokens[0].loc.start.line !== tokens[1].loc.start.line) {
        context.report(node.finalizer, CLOSE_MESSAGE);
      }
    }
  }

  /**
   * Enforces the configured brace style on CatchClauses
   * @param {ASTNode} node A CatchClause node.
   * @returns {void}
   * @private
   */
  function checkCatchClause(node) {
    var previousToken = context.getTokenBefore(node),
      firstToken = context.getFirstToken(node);

    checkBlock('body')(node);

    if (isBlock(node.body)) {
      if (previousToken.loc.start.line !== firstToken.loc.start.line) {
        context.report(node, CLOSE_MESSAGE);
      }
    }
  }

  /**
   * Enforces the configured brace style on SwitchStatements
   * @param {ASTNode} node A SwitchStatement node.
   * @returns {void}
   * @private
   */
  function checkSwitchStatement(node) {
    var tokens;
    if (node.cases && node.cases.length) {
      tokens = context.getTokensBefore(node.cases[0], 2);
      if (tokens[0].loc.start.line !== tokens[1].loc.start.line) {
        context.report(node, OPEN_MESSAGE);
      }
    } else {
      tokens = context.getLastTokens(node, 3);
      if (tokens[0].loc.start.line !== tokens[1].loc.start.line) {
        context.report(node, OPEN_MESSAGE);
      }
    }
  }

  return {
    FunctionDeclaration: checkBlock('body'),
    FunctionExpression: checkBlock('body'),
    ArrowFunctionExpression: checkBlock('body'),
    IfStatement: checkIfStatement,
    TryStatement: checkTryStatement,
    CatchClause: checkCatchClause,
    DoWhileStatement: checkBlock('body'),
    WhileStatement: checkBlock('body'),
    WithStatement: checkBlock('body'),
    ForStatement: checkBlock('body'),
    ForInStatement: checkForInStatement,
    ForOfStatement: checkBlock('body'),
    SwitchStatement: checkSwitchStatement
  };
};
