export default function config() {
  return {
    variables: {
      '--scope-background-color': {
        type: 'text',
        label: 'Background Color',
        helpText: 'The background color of the footer.',
      },
      '--scope-color': {
        type: 'text',
        label: 'Color',
        helpText: 'The text color of the footer.',
      },
    },
    selection: {
      Default: {
        descritpion: {
          label: 'Default',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/footer/default.png',
        },
        variables: {
          '--scope-background-color': 'black',
          '--scope-color': 'white',
        },
      },
      Inverted: {
        descritpion: {
          label: 'Inverted colors',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/footer/inverted.png',
        },
        variables: {
          '--scope-background-color': 'white',
          '--scope-color': 'black',
        },
      },
    },
  };
}
