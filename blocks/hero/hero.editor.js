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
      Default: {
        descritpion: {
          label: 'Image on the Left',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/hero/imageontheleft.png',
        },
        variables: {
          '--hero-color': 'white',
          '--hero-background': 'black',
          '--hero-padding-block': '20px',
          '--hero-grid-template-columns': '0.4fr 0.6fr',
        },
        attributes: {
          'data-order': '1',
        },
      },
      Inverted: {
        descritpion: {
          label: 'Invert colors',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/hero/invertedcolor.png',
        },
        variables: {
          '--hero-color': 'black',
          '--hero-background': 'white',
          '--hero-padding-block': '20px',
          '--hero-grid-template-columns': '0.4fr 0.6fr',
        },
        attributes: {
          'data-order': '2',
        },
      },
      'Image on the right': {
        descritpion: {
          label: 'Image on the right',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/hero/imageontherigth.png',
        },
        variables: {
          '--hero-color': 'white',
          '--hero-background': 'black',
          '--hero-padding-block': '20px',
          '--hero-grid-template-columns': '0.6fr 0.4fr',
        },
        attributes: {
          'data-order': '0',
        },
      },
    },
  };
}
