import * as migration_20260509_232232_initial from './20260509_232232_initial';

export const migrations = [
  {
    up: migration_20260509_232232_initial.up,
    down: migration_20260509_232232_initial.down,
    name: '20260509_232232_initial'
  },
];
