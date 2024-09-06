export default function config() {
  return {
    attributes: {
      data: {
        type: {
          type: 'select',
          options: [
            {
              label: 'Default',
              value: 'default',
            },
            {
              label: 'Primary',
              value: 'primary',
            },
            {
              label: 'Secondary',
              value: 'secondary',
            },
            {
              label: 'Success',
              value: 'success',
            },
            {
              label: 'Danger',
              value: 'danger',
            },
            {
              label: 'Warning',
              value: 'warning',
            },
            {
              label: 'Info',
              value: 'info',
            },
            {
              label: 'Light',
              value: 'light',
            },
            {
              label: 'Dark',
              value: 'dark',
            },
          ],
          label: 'Type',
          helpText: 'The type of the header.',
        },
      },
    },
  };
}
