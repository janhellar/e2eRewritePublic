import { Project, SyntaxKind, Node, ts, ExpressionStatement, SourceFile } from 'ts-morph';

export interface ParsedSpec {
	mochaNodes: MochaNode[];
	sourceFile: SourceFile;
}

export interface MochaNode {
  type: string;
  title: string;
	children: MochaNode[];
	node: Node<ts.Node>;
	level: number;
}

const mochaFunctions = ['afterEach', 'after', 'beforeEach', 'before', 'describe', 'it'];

function getChildOfKind(node: Node<ts.Node>, kind: SyntaxKind): Node<ts.Node> | undefined {
	let result;

	node.forEachChild(n => {
		if (n.getKind() === kind) {
			result = n;
		}
	});

	return result;
}

function removeBraces(code: string): string {
	return code.trim().substring(1, code.length - 1);
}

export function getBlock(node: Node<ts.Node>): Node<ts.Node> | undefined {
  const callExpression = getChildOfKind(node, SyntaxKind.CallExpression);
  if (!callExpression) return;

  const functionExpression = getChildOfKind(callExpression, SyntaxKind.FunctionExpression) || getChildOfKind(callExpression, SyntaxKind.ArrowFunction);
  if (!functionExpression) return;

	const block = getChildOfKind(functionExpression, SyntaxKind.Block);
	return block;
}

function getMochaNodeTitle(node: Node<ts.Node>): string {
  const callExpression = getChildOfKind(node, SyntaxKind.CallExpression);
  if (!callExpression) return '';

  const stringLiteral = getChildOfKind(callExpression, SyntaxKind.StringLiteral);
  if (!stringLiteral) {
		const templateExpression = getChildOfKind(callExpression, SyntaxKind.TemplateExpression);
		if (!templateExpression) return '';

		return removeBraces(templateExpression.getText());
	};

	// return stringLiteral && removeBraces(stringLiteral.getText());
	return removeBraces(stringLiteral.getText());
}

function getExpressionIdentifier(node: ExpressionStatement): string {
	const expression = node.getExpression();
	if (Node.isCallExpression(expression)) {
		const id = expression.getExpression();
		if (Node.isIdentifier(id)) {
			return id.getText();
		}
	}

	return '';
}

function getMochaNodes(node: Node<ts.Node>): MochaNode[] {
	if (!node) return [];

	const mochaNodes: MochaNode[] = [];

	node.forEachChild(n => {
		if (Node.isExpressionStatement(n)) {
			const expression = getExpressionIdentifier(n);
			if (mochaFunctions.includes(expression)) {
				const block = getBlock(n);

				mochaNodes.push({
					type: expression,
					title: getMochaNodeTitle(n),
					children: block ? getMochaNodes(block) : [],
					node: n,
					level: 0,
				})
			} else {
				mochaNodes.push({
					type: '',
					title: '',
					children: getMochaNodes(n),
					node: n,
					level: 0,
				});
			}
		} else {
			mochaNodes.push({
				type: '',
				title: '',
				children: getMochaNodes(n),
				node: n,
				level: 0,
			});
		}
	});

	return mochaNodes;
}

export default function parseSpec(specFile: string): ParsedSpec {
  const project = new Project();
	try {
  	const sourceFile = project.createSourceFile('spec.ts', specFile)
		const node = sourceFile.getFirstChildByKindOrThrow(SyntaxKind.ExpressionStatement);
		return {
			mochaNodes: flatten(getMochaNodes(node.getParent())),
			sourceFile: sourceFile,
		};
	} catch (_) {
		return {
			mochaNodes: [],
			sourceFile: project.createSourceFile('error.ts', ''),
		}
	}
}

function flatten(nodes: MochaNode[], level: number = 0): MochaNode[] {
	const result: MochaNode[] = [];

	nodes.forEach(node => {
		node.level = level;
		result.push(node);
		result.push(...flatten(node.children, node.type === 'describe' ? level + 1 : level));
	});

	return result;
}
