import * as migration_20260509_232232_initial from './20260509_232232_initial';
import * as migration_20260510_052735_settings_hero_extras from './20260510_052735_settings_hero_extras';

export const migrations = [
  {
    up: migration_20260509_232232_initial.up,
    down: migration_20260509_232232_initial.down,
    name: '20260509_232232_initial',
  },
  {
    up: migration_20260510_052735_settings_hero_extras.up,
    down: migration_20260510_052735_settings_hero_extras.down,
    name: '20260510_052735_settings_hero_extras'
  },
];
