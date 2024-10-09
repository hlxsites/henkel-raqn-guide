export default function config() {
  return {
    attributes: {
      grid: {
        ratio: {
          type: 'select',
          options: [
            {
              label: 'auto',
              value: 'auto',
            },
            {
              label: '4:3',
              value: '4/3',
            },
            {
              label: '16:9',
              value: '16/9',
            },
            {
              label: '1:1',
              value: '1/1',
            },
          ],
          label: 'Aspect Ratio',
          helpText: 'The aspect ratio of the card.',
        },
        columns: {
          type: 'select',
          options: [
            {
              label: '1 Column',
              value: '1',
            },
            {
              label: '2 Columns',
              value: '2',
            },
            {
              label: '3 Columns',
              value: '3',
            },
            {
              label: '4 Columns',
              value: '4',
            },
            {
              label: '5 Columns',
              value: '5',
            },
            {
              label: '6 Columns',
              value: '6',
            },
          ],
          label: 'Number of columns',
          helpText: 'Number of columns in the card grid.',
        },
      },
    },
  };
}
