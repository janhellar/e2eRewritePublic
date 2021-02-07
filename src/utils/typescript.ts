import { SyntaxKind, Node, ts, SourceFile, Project } from 'ts-morph';

export function getParsedSourceFile(code: string): SourceFile {
  const project = new Project();
  return project.createSourceFile('code.ts', code);
}

export function getCallIdentifier(node: Node<ts.Node>): string {
  if (Node.isExpressionStatement(node)) {
    const expression = node.getExpression();
    if (Node.isCallExpression(expression)) {
      const leftHandSideExpression = expression.getExpression();
      if (Node.isIdentifier(leftHandSideExpression)) {
        return leftHandSideExpression.getText();
      }
    }
  }

  return '';
}

export function getChildOfKind(node: Node<ts.Node>, kind: SyntaxKind): Node<ts.Node> | undefined {
  let result: Node<ts.Node> | undefined;

  node.forEachChild(n => {
    if (n.getKind() === kind) {
      result = n;
    }
  });

  return result;
}

export function getBlocksInside(node: Node<ts.Node>): Node<ts.Node>[] {
	const result: Node<ts.Node>[] = [];

	node.forEachChild(child => {
		if (Node.isBlock(child)) {
			result.push(child);
		} else {
			result.push(...getBlocksInside(child));
		}
	});

	return result;
}

export function getCallbackBlock(node: Node<ts.Node>): Node<ts.Node> | undefined {
  const callExpression = getChildOfKind(node, SyntaxKind.CallExpression);
  if (!callExpression) return;

  const functionExpression = getChildOfKind(callExpression, SyntaxKind.FunctionExpression) || getChildOfKind(callExpression, SyntaxKind.ArrowFunction);
  if (!functionExpression) return;

	const block = getChildOfKind(functionExpression, SyntaxKind.Block);
	return block;
}
