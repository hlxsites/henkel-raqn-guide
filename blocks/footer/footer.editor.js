export default function config() {
  return {
    variables: {
      '--background-color': {
        type: 'text',
        label: 'Background Color',
        scope: 'page',
        helpText: 'The background color of the footer.',
      },
      '--color': {
        type: 'text',
        label: 'Color',
        scope: 'global',
        helpText: 'The text color of the footer.',
      },
    },
    attributes: {
      class: {
        type: 'text',
        label: 'Class',
        helpText: 'The class of the footer.',
      },
    },
  };
}
