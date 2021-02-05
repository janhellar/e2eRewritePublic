import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import prettier from 'prettier/standalone';
import parserTypescript from 'prettier/parser-typescript';
import { Node } from 'ts-morph';

import parseSpec, { MochaNode, ParsedSpec, getBlock } from './parseSpec';

const spec = `// paste spec here`;

function removeBraces(code: string): string {
	return code.trim().substring(1, code.length - 2);
}

interface Hooks {
	beforeEach: string;
	afterEach: string;
}

function processNew(node: MochaNode, log: string, hooks?: Hooks): string {
	if (node.type === 'describe') {
		const structure: {
			before: string[],
			main: string[],
			after: string[],
		} = {
			before: [],
			main: [],
			after: [],
		};

		let newLog: string;
		if (log === '__rootDescribe') {
			newLog = '';
		} else {
			newLog = `${log ? `${log} - ` : ''}${node.title}`;
		}

		const beforeEach = node.children.filter(node => node.type === 'beforeEach').map(n => processNew(n, newLog)).join('\n');
		const afterEach = node.children.filter(node => node.type === 'afterEach').map(n => processNew(n, newLog)).join('\n');

		let currentPart = structure.before;

		node.children.forEach(child => {
			if (child.type === 'before') {
				structure.before.push(processNew(child, newLog));
			} else if (child.type === 'after') {
				structure.after.push(processNew(child, newLog));
			} else if (child.type === 'beforeEach' || child.type === 'afterEach') {

			} else {
				if (child.type === 'it' || child.type === 'describe' || containsItOrDescribe(child)) {
					currentPart = structure.main;
				}

				currentPart.push(processNew(child, newLog, {
					beforeEach,
					afterEach,
				}));
			}
		});

		const result = structure.before.join('\n') + structure.main.join('\n') + structure.after.join('\n');

		if (hooks) {
			return hooks.beforeEach + result + hooks.afterEach;
		} else {
			return result;
		}		
	} else if (node.type === 'it') {
		const block = getBlock(node.node);
		if (block) {
			let result: string;

			if (hooks) {
				result = hooks.beforeEach + block.getFullText() + hooks.afterEach;
			} else {
				result = block.getFullText();
			}

			return `
				cy.log(\`${`${log ? `${log} - ` : ''}${node.type} ${node.title}`.trim()}\`);
				${result}
			`;
		} else {
			return '';
		}
	} else if (node.type !== '') {
		const block = getBlock(node.node);
		if (block) {
			return `
				cy.log(\`${`${log ? `${log} - ` : ''}${node.type} ${node.title}`.trim()}\`);
				${block.getFullText()}
			`;
		} else {
			return '';
		}
	} else if (Node.isBlock(node.node)) {
		const result: string[] = [];

		node.children.forEach(child => {
			result.push(processNew(child, log, hooks));
		});

		return result.join('\n');
	} else {
		if (containsItOrDescribe(node)) {
			const blocksInside = getBlocksInside(node);

			blocksInside.forEach(block => {
				block.node = block.node.replaceWithText(`{${processNew(block, log)}}`);
			});
		}
		
		return node.node.getFullText();
	}
}

function getBlocksInside(node: MochaNode): MochaNode[] {
	const result: MochaNode[] = [];

	node.children.forEach(child => {
		if (Node.isBlock(child.node)) {
			result.push(child);
		} else {
			result.push(...getBlocksInside(child));
		}
	});

	return result;
}

function containsItOrDescribe(node: MochaNode): boolean {
	return node.children.reduce<boolean>((prev, curr) => {
		if (prev) return true;
		if (curr.type === 'it' || curr.type === 'describe') return true;
		return containsItOrDescribe(curr);
	}, false);
}

// function process(node: MochaNode, log: string, rootDescribe: boolean = false): string {
// 	if (node.type === 'describe') {
// 		const befores = node.children.filter(node => node.type === 'before');
// 		const afters = node.children.filter(node => node.type === 'after');
// 		const beforeEachs = node.children.filter(node => node.type === 'beforeEach');
// 		const afterEachs = node.children.filter(node => node.type === 'afterEach');
// 		const others = node.children.filter(node => node.type === 'it' || node.type === 'describe');

// 		const newLog = `${log ? `${log} - ` : ''}${rootDescribe ? '' : node.title}`
// 		const processWithLog = (n: MochaNode): string => process(n, newLog);

// 		return `
// 			${befores.map(processWithLog).join('\n')}

// 			${others.map(other => {
// 				return `
// 					${beforeEachs.map(processWithLog).join('\n')}

// 					${processWithLog(other)}

// 					${afterEachs.map(processWithLog).join('\n')}
// 				`;
// 			}).join('\n')}

// 			${afters.map(processWithLog).join('\n')}
// 		`;
// 	} else {
// 		const block = getBlock(node.node);
// 		return block ? `
// 			cy.log('${`${log ? `${log} - ` : ''}${node.type} ${node.title}`.trim()}');
// 			${block.getFullText()}
// 		` : '';
// 	}
// }

function App() {
  const [specFile, setSpecFile] = useState(spec);
  const [parsedFile, setParsedFile] = useState<ParsedSpec | undefined>();
  const [selected, setSelected] = useState<number[]>([]);
  const [processedFile, setProcessedFile] = useState('');

	useEffect(() => {
		setParsedFile(parseSpec(specFile));
	}, [specFile]);

  useEffect(() => {
    if (!specFile || !parsedFile || selected.length === 0) return;

    const parsedFile2 = parseSpec(specFile);

		const selectedDescribe = parsedFile2.mochaNodes.filter(node => node.type === 'describe')[selected[0]];

		const processedDescribe = processNew(selectedDescribe, '__rootDescribe');

		// selectedDescribe.children.forEach(child => {
		// 	if (Node.isExpressionStatement(child.node)) {
		// 		child.node.remove();
		// 	}
		// });

		// const declarations = getBlock(selectedDescribe.node);

		const result = `
			it('${selectedDescribe.title}', () => {
				${/*declarations ? removeBraces(declarations.getFullText()) : ''*/''}
				${processedDescribe}
			});
		`

		parsedFile2.mochaNodes.filter(node => node.type === 'describe')[selected[0]].node.replaceWithText(
			// prettier.format(result, { parser: 'typescript', plugins: [ parserTypescript ]})
			result
		);
		
		try {
			const pretty = prettier.format(parsedFile2.sourceFile.getText(), { parser: 'typescript', plugins: [ parserTypescript ]})
			setProcessedFile(pretty);
		} catch (_) {
			parsedFile2.sourceFile.formatText();
			setProcessedFile(parsedFile2.sourceFile.getText());
		}
  }, [specFile, parsedFile, selected]);

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'row' }}>
      <Editor
        height="90vh"
        width="40vw"
        defaultLanguage="typescript"
        defaultValue={specFile}
        onChange={value => {
          if (value) {
            setSpecFile(value);
          }
        }}
      />
      <div style={{ width: '20vw' }}>
        {parsedFile && parsedFile
					.mochaNodes
					.filter(node => node.type === 'describe')
					.map((node, index) => {
						return (
							<div key={index}>
								<label style={{ paddingLeft: node.level * 20 }}>
									<input type="checkbox" onChange={event => {
										setSelected(prev => {
											if (event.target.checked) {
												return [...prev, index];
											} else {
												return prev.filter(a => a !== index);
											}
										});
									}} />
									{' '}{node.title}
								</label>
								<br />
							</div>
						);
        	})
				}
      </div>
      <div>
        <Editor
          height="90vh"
          width="40vw"
          defaultLanguage="typescript"
          value={processedFile}
        />
      </div>
    </div>
  );
}

export default App;
