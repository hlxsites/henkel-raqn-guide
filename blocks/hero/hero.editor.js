export default function config() {
  return {
    attributes: {
      data: {
        order: {
          type: 'select',
          options: [
            {
              label: 'Image on the right',
              value: '0',
            },
            {
              label: 'Image on the left',
              value: '1',
            },
          ],
          label: 'Order',
          helpText: 'Order of the columns.',
        },
        width: {
          type: 'text',
          label: 'Width',
          value: '100%',
          helpText: 'Width of the hero.',
        },
      },
    },
  };
}
