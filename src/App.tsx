import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import prettier from 'prettier/standalone';
import parserTypescript from 'prettier/parser-typescript';
import { Node } from 'ts-morph';

import parseSpec, { MochaNode, ParsedSpec, getBlock } from './parseSpec';

const spec = `
// paste spec here

// example:

describe('test D', () => {

	before(() => {
		beforeCommand();
	});

	it('should test 1', () => {
		command1();
	});

	it('should test 2', () => {
		command2();
	});

});
`;

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
		let children = [...node.children];

		let rootHooks = '';

		if (log === '__rootDescribe') {
			newLog = '';

			const befores = children.filter(node => node.type === 'before');
			const afters = children.filter(node => node.type === 'after');

			rootHooks += befores.map(b => b.node.getFullText()).join('\n');
			rootHooks += afters.map(a => a.node.getFullText()).join('\n');

			children = children.filter(node => node.type !== 'before' && node.type !== 'after');
		} else {
			newLog = `${log ? `${log} - ` : ''}${node.title}`;
		}

		const beforeEach = children.filter(node => node.type === 'beforeEach').map(n => processNew(n, newLog)).join('\n');
		const afterEach = children.filter(node => node.type === 'afterEach').map(n => processNew(n, newLog)).join('\n');

		let currentPart = structure.before;

		children.forEach(child => {
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

		let result = '';

		if (log === '__rootDescribe') {
			result = `
				${structure.before.join('\n')}
				
				${rootHooks}
				
				it('should pass', () => {
					${structure.main.join('\n')}
				});
			`;
		} else {
			result = `
				${structure.before.join('\n')}

				${structure.main.join('\n')}
			
				${structure.after.join('\n')}
			`;
		}

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
				block.node = block.node.replaceWithText(`{${processNew(block, log, hooks)}}`);
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
	const [disabled, setDisabled] = useState<number[]>([]);
  const [processedFile, setProcessedFile] = useState('');

	useEffect(() => {
		setParsedFile(parseSpec(specFile));
	}, [specFile]);

  useEffect(() => {
    if (!specFile) return;

    const parsedFile2 = parseSpec(specFile);

		selected.forEach(describeIndex => {
			const selectedDescribe = parsedFile2.mochaNodes
				.filter(node => node.type === 'describe')[describeIndex];

			const processedDescribe = processNew(selectedDescribe, '__rootDescribe');

			const result = `
				describe(\`${selectedDescribe.title}\`, () => {
					${processedDescribe}
				});
			`

			selectedDescribe.node = selectedDescribe.node.replaceWithText(result);
		});
			
		try {
			const pretty = prettier.format(parsedFile2.sourceFile.getText(), { parser: 'typescript', plugins: [ parserTypescript ]})
			setProcessedFile(pretty);
		} catch (_) {
			parsedFile2.sourceFile.formatText();
			setProcessedFile(parsedFile2.sourceFile.getText());
		}
  }, [specFile, selected]);

	function onChangeSelected(prev: number[], index: number, checked: boolean): number[] {
		if (!parsedFile) return [];
		
		const describes = parsedFile.mochaNodes.filter(node => node.type === 'describe');

		let newSelected = [...prev];
		let newDisabled = [...disabled];

		if (checked) {
			newSelected.push(index);
		} else {
			newSelected = newSelected.filter(a => a !== index);
		}

		if (index < describes.length - 1) {
			const following = describes
				.map((node, index) => ({ node, index }))
				.slice(index + 1)

			let levelBelow = true;

			for (let i = 0; i < following.length && levelBelow; i++) {
				if (following[i].node.level <= describes[index].level) {
					levelBelow = false;
				} else {
					const ind = following[i].index;
					if (checked) {
						newSelected = newSelected.filter(a => a !== ind);
						newDisabled.includes(ind) || newDisabled.push(ind);
					} else {
						newDisabled = newDisabled.filter(a => a !== ind);
					}
				}
			}
		}

		setDisabled(newDisabled);
		return newSelected;
	}

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'row' }}>
      <Editor
        height="90vh"
        width="40vw"
        defaultLanguage="typescript"
        defaultValue={specFile}
        onChange={value => {
					setDisabled([]);
					setSelected([]);
          if (value) {
            setSpecFile(value);
          }
        }}
      />
      <div style={{ width: '20vw' }}>
				<br />
				Select describes you want to merge into one it:
				<br /><br />
        {parsedFile && parsedFile
					.mochaNodes
					.filter(node => node.type === 'describe')
					.map((node, index) => {
						return (
							<div key={index}>
								<label style={{ paddingLeft: node.level * 20 }}>
									<input type="checkbox" checked={selected.includes(index)} disabled={disabled.includes(index)} onChange={event => {
										setSelected(prev => {
											return onChangeSelected(prev, index, event.target.checked);
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
