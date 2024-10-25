/* eslint-disable import/prefer-default-export */

export const componentList = {
  section: {
    transform(node) {
      node.class.push('error-message-box');
      node.newChildren({
        tag: 'textNode',
        text: 'The content of this section is hidden because it contains more than 1 grid which is not supported. Please fix.',
      });
    },
  },
};
