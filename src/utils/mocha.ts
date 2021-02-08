import { SyntaxKind, Node, ts, SourceFile } from 'ts-morph';
import prettier from 'prettier/standalone';
import parserTypescript from 'prettier/parser-typescript';

import { getCallIdentifier, getChildOfKind, getCallbackBlock, getBlocksInside } from './typescript';
import { removeSurroundingChars } from './common';

const mochaHooks = ['afterEach', 'after', 'beforeEach', 'before'];
export interface DescribeCall {
  title: string;
  level: number;
  node: Node<ts.Node>;
}

interface DescribeSections {
  before: Node<ts.Node>[];
  main: Node<ts.Node>[];
  after: Node<ts.Node>[];
}

interface EachHooks {
	beforeEach: string;
	afterEach: string;
}

export function getDescribeCalls(node: Node<ts.Node> | SourceFile, level: number = 0): DescribeCall[] {
  const result: DescribeCall[] = [];

  node.forEachChild(n => {
    const isDescribe = isMochaCallOfType(n, 'describe');

    if (isDescribe) {
      result.push({
        title: getMochaCallTitle(n),
        level,
        node: n,
      });
    }

    result.push(...getDescribeCalls(n, isDescribe ? level + 1 : level));
  });

  return result;
}

export function flattenDescribeSpecs(sourceFile: SourceFile, describeCalls: DescribeCall[]): string {
  describeCalls.forEach(describeCall => {
    describeCall.node.replaceWithText(flattenDescribeSpec(describeCall.node));
  });
    
  try {
    return prettier.format(sourceFile.getText(), {
      parser: 'typescript',
      plugins: [ parserTypescript ],
      useTabs: true,
      singleQuote: true,
      trailingComma: 'all',
      arrowParens: 'always',
      endOfLine: 'lf',
    });
  } catch (_) {
    sourceFile.formatText();
    return sourceFile.getText();
  }
}

function flattenDescribeSpec(node: Node<ts.Node>): string {
  const block = getCallbackBlock(node);

  if (!block) return '';

  const logPrefix = '';
  const hooks = getFlattenedHooks(block);
  const eachHooks = getFlattenedEachHooks(block, logPrefix);
  const children = getChildren(block).filter(node => !isMochaHook(node));
  const sections = sortDescribeContent(children);

  return `
    describe${isSkipped(node) ? '.skip' : ''}(${wrapWithQuotes(getMochaCallTitle(node))}, () => {
      ${flattenNodes(sections.before, logPrefix)}
      
      ${hooks}
      
      it('should pass', () => {
        ${flattenNodes(sections.main, logPrefix, eachHooks)}
      });
    });
  `;
}

function containsItOrDescribe(node: Node<ts.Node>): boolean {
	return getChildren(node).reduce<boolean>((prev, curr) => {
		if (prev) return true;
		if (isMochaCallOfType(curr, 'it') || isMochaCallOfType(curr, 'describe')) return true;
		return containsItOrDescribe(curr);
	}, false);
}

function flatten(node: Node<ts.Node>, logPrefix: string, eachHooks?: EachHooks): string {
  if (isMochaCallOfType(node, 'describe')) {
		return flattenDescribe(node, logPrefix, eachHooks);
	}
  
  if (isMochaCallOfType(node, 'it')) {
		return flattenIt(node, logPrefix, eachHooks);
	}
  
  if (isMochaHook(node)) {
		return flattenHook(node, logPrefix);
	}
  
  if (Node.isBlock(node)) {
		return flattenBlock(node, logPrefix, eachHooks);
	}

  if (containsItOrDescribe(node)) {
    flattenBlocksInside(node, logPrefix, eachHooks);
  }
  
  return node.getFullText();
}

function flattenDescribe(node: Node<ts.Node>, logPrefix: string, eachHooks?: EachHooks): string {
  const block = getCallbackBlock(node);

  if (!block) return '';

  const sections = sortDescribeContent(getChildren(block));
  const newLogPrefix = prependLog(logPrefix, getMochaCallTitle(node));
  const eachHooksInside = getFlattenedEachHooks(block, newLogPrefix);

  let result = `
    ${flattenNodes(sections.before, newLogPrefix)}

    ${flattenNodes(sections.main, newLogPrefix, eachHooksInside)}

    ${flattenNodes(sections.after, newLogPrefix)}
  `;

  if (!redundantCurlyBraces(block)) {
    result = `{
      ${result}
    }`;
  }

  result = wrapCodeWithEachHooks(result, eachHooks);

  if (isSkipped(node)) {
    result = wrapWithSkipCode(result);
  }

  return result;
}

function flattenNodes(nodes: Node<ts.Node>[], logPrefix: string, eachHooks?: EachHooks): string {
  return nodes
    .map(node => flatten(node, logPrefix, eachHooks))
    .join(' ');
}

function flattenIt(node: Node<ts.Node>, logPrefix: string, eachHooks?: EachHooks): string {
  const block = getCallbackBlock(node);
  
  if (!block) return '';

  let result = `
    ${getCyLog(logPrefix, node)}
    ${removeRedundantCurlyBraces(block)}
  `;

  result = wrapCodeWithEachHooks(result, eachHooks);

  if (isSkipped(node)) {
    result = wrapWithSkipCode(result);
  }

  return result;
}

function flattenHook(node: Node<ts.Node>, logPrefix: string): string {
  const block = getCallbackBlock(node);

  if (!block) return '';
    
  return `
    ${getCyLog(logPrefix, node)}
    ${removeRedundantCurlyBraces(block)}
  `;
}

function flattenBlock(block: Node<ts.Node>, logPrefix: string, eachHooks?: EachHooks): string {
  const result: string[] = [];

  block.forEachChild(child => {
    result.push(flatten(child, logPrefix, eachHooks));
  });

  return result.join('\n');
}

function flattenBlocksInside(node: Node<ts.Node>, logPrefix: string, eachHooks?: EachHooks) {
  const blocksInside = getBlocksInside(node);

  blocksInside.forEach(block => {
    block.replaceWithText(`{${flatten(block, logPrefix, eachHooks)}}`);
  });
}

function getCyLog(prefix: string, node: Node<ts.Node>): string {
  const log = `${getCallIdentifier(node)} ${getMochaCallTitle(node)}`.trim();

  return `cy.log(${wrapWithQuotes(prependLog(prefix, log))});`;
}

function prependLog(prefix: string, log: string): string {
  return `${prefix ? `${prefix} - ` : ''}${log}`;
}

function getFlattenedEachHooks(block: Node<ts.Node>, logPrefix: string): EachHooks {
  return {
    beforeEach: getFlattenedEachHooksOfType(block, 'beforeEach', logPrefix),
    afterEach: getFlattenedEachHooksOfType(block, 'afterEach', logPrefix),
  };
}

function getFlattenedEachHooksOfType(block: Node<ts.Node>, hookType: string, logPrefix: string): string {
  return getChildren(block)
    .filter(node => isMochaCallOfType(node, hookType))
    .map(node => flatten(node, logPrefix))
    .join('\n');
}

function getFlattenedHooks(block: Node<ts.Node>): string {
  const children = getChildren(block);

  const befores = children.filter(node => isMochaCallOfType(node, 'before'));
  const afters = children.filter(node => isMochaCallOfType(node, 'after'));

  return [...befores, ...afters].map(node => node.getFullText()).join('\n');
}

function wrapCodeWithEachHooks(code: string, eachHooks?: EachHooks): string {
  if (eachHooks) {
    return eachHooks.beforeEach + code + eachHooks.afterEach;
  } else {
    return code;
  }
}

function sortDescribeContent(nodes: Node<ts.Node>[]): DescribeSections {
  const sections: DescribeSections = {
    before: [],
    main: [],
    after: [],
  };

  let currentSection = sections.before;

  nodes.forEach(node => {
    if (isMochaCallOfType(node, 'before')) {
      sections.before.push(node);
    } else if (isMochaCallOfType(node, 'after')) {
      sections.after.push(node);
    } else if (!isMochaHook(node)) {
      if (isMochaCallOfType(node, 'it') || isMochaCallOfType(node, 'describe') || containsItOrDescribe(node)) {
        currentSection = sections.main;
      }
  
      currentSection.push(node);
    }
  });

  return sections;
}

function isMochaCallOfType(node: Node<ts.Node>, type: string): boolean {
  if (Node.isExpressionStatement(node)) {
    const callIdentifier = getCallIdentifier(node);
    return callIdentifier === type || callIdentifier === `${type}.skip`;
  }

  return false;
}

function isSkipped(node: Node<ts.Node>): boolean {
  if (Node.isExpressionStatement(node)) {
    const callIdentifier = getCallIdentifier(node);
    return callIdentifier.endsWith('.skip');
  }

  return false;
}

function isMochaHook(node: Node<ts.Node>): boolean {
  if (Node.isExpressionStatement(node)) {
    const callIdentifier = getCallIdentifier(node);
    return mochaHooks.includes(callIdentifier);
  }

  return false;
}

function getMochaCallTitle(node: Node<ts.Node>): string {
  const callExpression = getChildOfKind(node, SyntaxKind.CallExpression);
  if (!callExpression) return '';

  const stringLiteral = getChildOfKind(callExpression, SyntaxKind.StringLiteral);
  if (stringLiteral) {
    return removeSurroundingChars(stringLiteral.getText());
  };

  const templateExpression = getChildOfKind(callExpression, SyntaxKind.TemplateExpression);
  if (templateExpression) {
    return removeSurroundingChars(templateExpression.getText());
  }

  return '';
}

function getChildren(node: Node<ts.Node>): Node<ts.Node>[] {
  const result: Node<ts.Node>[] = [];

  node.forEachChild(child => {
    result.push(child)
  });
  
  return result;
}

function redundantCurlyBraces(block: Node<ts.Node>): boolean {
  let redundant = true;

  block.forEachChild(child => {
    if (Node.isVariableStatement(child) || Node.isFunctionDeclaration(child)) {
      redundant = false;
    }
  });

  return redundant;
}

function removeRedundantCurlyBraces(block: Node<ts.Node>): string {
  if (redundantCurlyBraces(block)) {
    return removeSurroundingChars(block.getText());
  }
  
  return block.getFullText();
}

function wrapWithSkipCode(code: string): string {
  return `
    {
      const skip = true;
      if (!skip) {
        ${code}
      }
    }
  `;
}

function wrapWithQuotes(text: string): string {
  if (text.match(/.*\$\{.*\}.*/)) {
    return '`' + text + '`';
  }

  return `'${text}'`;
}
