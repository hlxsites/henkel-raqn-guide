export default function config() {
  return {
    variables: {
      '--hero-color': {
        type: 'text',
        label: 'Color',
        helpText: 'The text color of the hero.',
      },
      '--hero-background': {
        type: 'text',
        label: 'Background',
        helpText: 'The background color of the hero.',
      },
      '--hero-padding-block': {
        type: 'text',
        label: 'Padding Block',
        helpText: 'The padding block of the hero.',
      },
      '--hero-grid-template-columns': {
        type: 'text',
        label: 'Grid Template Columns',
        helpText: 'The grid template columns of the hero.',
      },
    },
    attributes: {
      'data-order': {
        type: 'text',
        label: 'Order',
        helpText: 'The order of the hero.',
      },
    },
    selection: {
      'Image on the right': {
        attributes: {
          'data-order': '0',
        },
      },
      'Image on the left': {
        attributes: {
          'data-order': '1',
        },
      },
    },
  };
}
