export default function config() {
  return {
    variables: {
      '--accent-background': {
        type: 'text',
        label: 'Background',
        helpText: 'The background color of the button.',
      },
      '--accent-color': {
        type: 'text',
        label: 'Color',
        helpText: 'The text color of the button.',
      },
      '--button-padding-block': {
        type: 'text',
        label: 'Padding Block',
        helpText: 'The padding block of the button.',
      },
      '--button-padding-inline': {
        type: 'text',
        label: 'Padding Inline',
        helpText: 'The padding inline of the button.',
      },
      '--border-block-end': {
        type: 'text',
        label: 'Border Block End',
        helpText: 'The border block end of the button.',
      },
      '--border-radius': {
        type: 'text',
        label: 'Border Radius',
        helpText: 'The border radius of the button.',
      },
      '--border-block-start': {
        type: 'text',
        label: 'Border Block Start',
        helpText: 'The border block start of the button.',
      },
      '--border-inline-end': {
        type: 'text',
        label: 'Border Inline End',
        helpText: 'The border inline end of the button.',
      },
      '--border-inline-start': {
        type: 'text',
        label: 'Border Inline Start',
        helpText: 'The border inline start of the button.',
      },
      '--box-shadow': {
        type: 'text',
        label: 'Box Shadow',
        helpText: 'The box shadow of the button.',
      },
      '--accent-background-hover': {
        type: 'text',
        label: 'Background Hover',
        helpText: 'The background color of the button when hovered.',
      },
      '--accent-color-hover': {
        type: 'text',
        label: 'Color Hover',
        helpText: 'The text color of the button when hovered.',
      },
      '--justify': {
        type: 'text',
        label: 'Justify',
        helpText: 'The justify of the button.',
      },
    },
    selection: {
      Blue: {
        descritpion: {
          label: 'Regular Blue Button',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/button/blue.png',
        },
        variables: {
          '--accent-background': '#007bff',
          '--accent-color': '#fff',
          '--border-block-end': '0',
          '--border-block-start': '0',
          '--border-inline-end': '0',
          '--border-inline-start': '0',
          '--box-shadow': 'none',
          '--accent-background-hover': '#0056b3',
          '--accent-color-hover': '#fff',
          '--justify': 'start',
        },
      },
      Red: {
        descritpion: {
          label: 'Regular Red Button',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/button/red.png',
        },
        variables: {
          '--accent-background': 'red',
          '--accent-color': 'white',
          '--border-block-end': '1px',
          '--border-block-start': '1px',
          '--border-inline-end': '1px',
          '--border-inline-start': '1px',
          '--box-shadow': '1px 1px 1px 1px rgba(0, 0, 0, 0.1)',
          '--accent-background-hover': 'white',
          '--accent-color-hover': 'red',
          '--justify': 'start',
        },
      },
      White: {
        descritpion: {
          label: 'Regular white Button',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/button/white.png',
        },
        variables: {
          '--accent-background': 'white',
          '--accent-color': 'black',
          '--border-block-end': '10px',
          '--border-block-start': '10px',
          '--border-inline-end': '1px',
          '--border-inline-start': '1px',
          '--box-shadow': '1px 1px 1px 1px rgba(0, 0, 0, 0.1)',
          '--accent-background-hover': 'white',
          '--accent-color-hover': 'red',
          '--justify': 'start',
        },
      },
    },
  };
}
