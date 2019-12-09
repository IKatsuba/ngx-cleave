module.exports = {
  name: 'ngx-cleave',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/libs/ngx-cleave',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
