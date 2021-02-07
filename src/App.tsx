import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

import exampleSpec from './exampleSpec';
import { getParsedSourceFile } from './utils/typescript';
import { getDescribeCalls, flattenDescribeSpecs, DescribeCall } from './utils/mocha';

function App() {
  const [sourceFile, setSourceFile] = useState(getParsedSourceFile(exampleSpec));
  const [selected, setSelected] = useState<number[]>([]);
	const [disabled, setDisabled] = useState<number[]>([]);
  const [targetFile, setTargetFile] = useState('');

  useEffect(() => {
    if (!sourceFile) return;

		const describes = getDescribeCalls(sourceFile);
		const selectedDescribes = describes.filter((_, index) => selected.includes(index));

		setTargetFile(flattenDescribeSpecs(sourceFile, selectedDescribes));
  }, [sourceFile, selected]);

	function onChangeSelected(prev: number[], index: number, checked: boolean): number[] {
		if (!sourceFile) return [];
		
		const describes = getDescribeCalls(sourceFile);

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
        defaultValue={exampleSpec}
        onChange={value => {
					setDisabled([]);
					setSelected([]);
          if (value) {
            setSourceFile(getParsedSourceFile(value));
          }
        }}
      />
      <div style={{ width: '20vw' }}>
				<br />
				Select <i>describes</i> you want to flatten:
				<br /><br />
        {sourceFile && getDescribeCalls(sourceFile)
					.map((describe, index) => {
						return (
							<div key={index}>
								<label style={{ paddingLeft: describe.level * 20 }}>
									<input type="checkbox" checked={selected.includes(index)} disabled={disabled.includes(index)} onChange={event => {
										setSelected(prev => {
											return onChangeSelected(prev, index, event.target.checked);
										});
									}} />
									{' '}{describe.title}
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
          value={targetFile}
        />
      </div>
    </div>
  );
}

export default App;
