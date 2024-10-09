export default function config() {
  return {
    inline: {
      component: 'InlineEditGridComponent',
      inputs: [],
    },
    attributes: {
      grid: {
        'template-rows': {
          type: 'text',
          label: 'Row',
          helpText: 'The row number.',
          value: '1fr',
        },
        'template-columns': {
          type: 'text',
          label: 'Columns',
          helpText: 'The column number.',
          value: '1fr 1fr',
        },
        gap: {
          type: 'text',
          label: 'Gap',
          helpText: 'The gap between the grid items.',
          value: '20px',
        },
        height: {
          type: 'text',
          label: 'Height',
          helpText: 'The height of the grid.',
          value: 'initial',
        },
        width: {
          type: 'text',
          label: 'Width',
          helpText: 'The width of the grid.',
          value: 'auto',
        },
        reverse: {
          type: 'select',
          options: [
            {
              label: 'Default',
              value: 'default',
            },
            {
              label: 'True',
              value: 'true',
            },
            {
              label: 'Alternate',
              value: 'alternate',
            },
          ],
          label: 'Reverse',
          helpText: 'Reverse the order of the grid items.',
        },
        'justify-items': {
          type: 'select',
          options: [
            {
              label: 'Start',
              value: 'start',
            },
            {
              label: 'End',
              value: 'end',
            },
            {
              label: 'Center',
              value: 'center',
            },
            {
              label: 'Stretch',
              value: 'stretch',
            },
          ],
          label: 'Justify Items',
          helpText: 'The alignment of the items along the inline (row) axis.',
        },
        'align-items': {
          type: 'select',
          options: [
            {
              label: 'Start',
              value: 'start',
            },
            {
              label: 'End',
              value: 'end',
            },
            {
              label: 'Center',
              value: 'center',
            },
            {
              label: 'Stretch',
              value: 'stretch',
            },
          ],
          label: 'Align Items',
          helpText: 'The alignment of the items along the block (column) axis.',
        },
        'justify-content': {
          type: 'select',
          options: [
            {
              label: 'Start',
              value: 'start',
            },
            {
              label: 'End',
              value: 'end',
            },
            {
              label: 'Center',
              value: 'center',
            },
            {
              label: 'Stretch',
              value: 'stretch',
            },
            {
              label: 'Space Around',
              value: 'space-around',
            },
            {
              label: 'Space Between',
              value: 'space-between',
            },
            {
              label: 'Space Evenly',
              value: 'space-evenly',
            },
          ],
          label: 'Justify Content',
          helpText: 'The alignment of the grid along the inline (row) axis.',
        },
        'align-content': {
          type: 'select',
          options: [
            {
              label: 'Start',
              value: 'start',
            },
            {
              label: 'End',
              value: 'end',
            },
            {
              label: 'Center',
              value: 'center',
            },
            {
              label: 'Stretch',
              value: 'stretch',
            },
            {
              label: 'Space Around',
              value: 'space-around',
            },
            {
              label: 'Space Between',
              value: 'space-between',
            },
            {
              label: 'Space Evenly',
              value: 'space-evenly',
            },
          ],
          label: 'Align Content',
          helpText: 'The alignment of the grid along the block (column) axis.',
        },
      },
    },
  };
}
