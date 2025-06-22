export default {
  plugins: {
    'postcss-import': {},
    'postcss-nesting': {},
    'postcss-custom-properties': {
      preserve: false,
    },
    'autoprefixer': {},
    'cssnano': {
      preset: 'default',
    },
  },
};
