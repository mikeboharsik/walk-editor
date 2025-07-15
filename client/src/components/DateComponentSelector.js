const optionsPerRow = 5;

export default function DateComponentSelector({ isVisible, options, updateValue, revert }) {
  if (isVisible && options) {
    const sortedOptions = options.toSorted((a,b) => parseInt(a) < parseInt(b) ? -1 : parseInt(a) > parseInt(b) ? 1 : 0);
    const sections = [];
    const sectionCount = Math.ceil(sortedOptions.length / optionsPerRow);
    for (let i = 0; i < sectionCount; i++) {
      sections.push(sortedOptions.slice(i * optionsPerRow, (i * optionsPerRow) + optionsPerRow).map(component => {
        return <div key={`year-${component}`} style={{ cursor: 'pointer' }} onClick={() => updateValue(component)}>{component}</div>
      }));
    }

    return (
      <>
        {revert && <span style={{ cursor: 'pointer', marginBottom: '1em' }} onClick={revert}>{'←'}</span>}
        <div style={{ width: '30%' }}>
          {
            sections
              .map((section) => (
                <div style={{ display: 'flex', justifyContent: 'space-evenly', marginBottom: '1em' }}>
                  {section}
                </div>
              ))
          }
        </div>
      </>);
  }

  return null;
}
