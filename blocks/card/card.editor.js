export default function config() {
  return {
    sets: {
      '--background': {
        type: 'text',
        label: 'Background',
        helpText: 'The background color of the card.',
      },
      '--color': {
        type: 'text',
        label: 'Color',
        helpText: 'The text color of the card.',
      },
      '--gap': {
        type: 'text',
        label: 'Gap',
        helpText: 'The gap between cards.',
      },
      '--padding': {
        type: 'text',
        label: 'Padding',
        helpText: 'The padding of the card.',
      },
    },
    attributes: {
      'data-columns': {
        type: 'text',
        label: 'Number of Columns',
        helpText: 'The number of columns in the card grid.',
      },
      'data-eager': {
        type: 'text',
        label: 'Eager Loading',
        helpText: 'The number of images to load eagerly.',
      },
    },
    selection: {
      variant1: {
        attributes: {
          'data-columns': '2',
          'data-ratio': '4/3',
          'data-eager': '0',
        },
      },
      variant2: {
        attributes: {
          'data-columns': '3',
          'data-ratio': '4/3',
          'data-eager': '0',
        },
      },
      variant3: {
        attributes: {
          'data-columns': '4',
          'data-ratio': '4/3',
          'data-eager': '0',
        },
      },
    },
  };
}
