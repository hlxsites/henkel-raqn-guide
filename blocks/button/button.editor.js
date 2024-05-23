export default function config() {
  return {
    variables: {
      '--scope-accent-background': {
        type: 'text',
        label: 'Background',
        helpText: 'The background color of the button.',
      },
      '--scope-accent-color': {
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
      '--scope-border-block-end': {
        type: 'text',
        label: 'Border Block End',
        helpText: 'The border block end of the button.',
      },
      '--scope-border-radius': {
        type: 'text',
        label: 'Border Radius',
        helpText: 'The border radius of the button.',
      },
      '--scope-border-block-start': {
        type: 'text',
        label: 'Border Block Start',
        helpText: 'The border block start of the button.',
      },
      '--scope-border-inline-end': {
        type: 'text',
        label: 'Border Inline End',
        helpText: 'The border inline end of the button.',
      },
      '--scope-border-inline-start': {
        type: 'text',
        label: 'Border Inline Start',
        helpText: 'The border inline start of the button.',
      },
      '--scope-box-shadow': {
        type: 'text',
        label: 'Box Shadow',
        helpText: 'The box shadow of the button.',
      },
      '--scope-accent-background-hover': {
        type: 'text',
        label: 'Background Hover',
        helpText: 'The background color of the button when hovered.',
      },
      '--scope-accent-color-hover': {
        type: 'text',
        label: 'Color Hover',
        helpText: 'The text color of the button when hovered.',
      },
      '--scope-justify': {
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
          '--scope-accent-background': '#007bff',
          '--scope-accent-color': '#fff',
          '--scope-border-block-end': '0',
          '--scope-border-block-start': '0',
          '--scope-border-inline-end': '0',
          '--scope-border-inline-start': '0',
          '--scope-box-shadow': 'none',
          '--scope-accent-background-hover': '#0056b3',
          '--scope-accent-color-hover': '#fff',
          '--scope-justify': 'start',
        },
      },
      Red: {
        descritpion: {
          label: 'Regular Red Button',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/button/red.png',
        },
        variables: {
          '--scope-accent-background': 'red',
          '--scope-accent-color': 'white',
          '--scope-border-block-end': '1px',
          '--scope-border-block-start': '1px',
          '--scope-border-inline-end': '1px',
          '--scope-border-inline-start': '1px',
          '--scope-box-shadow': '1px 1px 1px 1px rgba(0, 0, 0, 0.1)',
          '--scope-accent-background-hover': 'white',
          '--scope-accent-color-hover': 'red',
          '--scope-justify': 'start',
        },
      },
      White: {
        descritpion: {
          label: 'Regular white Button',
          preview: 'http://localhost:8888/@henkel/theme-interface/assets/previews/button/white.png',
        },
        variables: {
          '--scope-accent-background': 'white',
          '--scope-accent-color': 'black',
          '--scope-border-block-end': '10px',
          '--scope-border-block-start': '10px',
          '--scope-border-inline-end': '1px',
          '--scope-border-inline-start': '1px',
          '--scope-box-shadow': '1px 1px 1px 1px rgba(0, 0, 0, 0.1)',
          '--scope-accent-background-hover': 'white',
          '--scope-accent-color-hover': 'red',
          '--scope-justify': 'start',
        },
      },
    },
  };
}
