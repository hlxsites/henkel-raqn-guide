export default function decorate(block) {
  const id = `gen${crypto.randomUUID().split('-')[0]}`;
  block.id = id;
  
  const columns = block.querySelectorAll(':scope > div > div');
  const columnCount = columns.length;
  // following line regex matches partition sizes separated by dashes like 1-2-3
  const columnPartionRegex = /^\d{1,}(?:-\d{1,})*$/;
  const columnPartions = [...block.classList].find((c) => columnPartionRegex.test(c))?.split('-') || [];
  
  let variables = '';
  for(let i = 0; i < columnCount; i+=1) {
    const partition = columnPartions.length > i ? columnPartions[i] : 1;
    variables += `--column${i}-flex: ${partition};`;
  }

  const style = document.createElement('style');
  style.textContent = `#${id} {
    ${variables}
  }`;
  block.parentNode.insertBefore(style, block);
}
