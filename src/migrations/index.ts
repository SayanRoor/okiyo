import * as migration_20260509_232232_initial from './20260509_232232_initial';
import * as migration_20260510_052735_settings_hero_extras from './20260510_052735_settings_hero_extras';
import * as migration_20260510_090603_products_colors from './20260510_090603_products_colors';
import * as migration_20260510_143000_redesign_fields from './20260510_143000_redesign_fields';
import * as migration_20260511_180000_hero_carousel from './20260511_180000_hero_carousel';
import * as migration_20260513_000000_products_rels from './20260513_000000_products_rels';
import * as migration_20260514_000000_products_kit from './20260514_000000_products_kit';
import * as migration_20260520_000000_products_try_on_image from './20260520_000000_products_try_on_image';
import * as migration_20260522_000000_products_enable_try_on from './20260522_000000_products_enable_try_on';
import * as migration_20260527_000000_settings_kaspi_url from './20260527_000000_settings_kaspi_url';
import * as migration_20260527_120000_settings_legal_fields from './20260527_120000_settings_legal_fields';

export const migrations = [
  {
    up: migration_20260509_232232_initial.up,
    down: migration_20260509_232232_initial.down,
    name: '20260509_232232_initial',
  },
  {
    up: migration_20260510_052735_settings_hero_extras.up,
    down: migration_20260510_052735_settings_hero_extras.down,
    name: '20260510_052735_settings_hero_extras',
  },
  {
    up: migration_20260510_090603_products_colors.up,
    down: migration_20260510_090603_products_colors.down,
    name: '20260510_090603_products_colors',
  },
  {
    up: migration_20260510_143000_redesign_fields.up,
    down: migration_20260510_143000_redesign_fields.down,
    name: '20260510_143000_redesign_fields',
  },
  {
    up: migration_20260511_180000_hero_carousel.up,
    down: migration_20260511_180000_hero_carousel.down,
    name: '20260511_180000_hero_carousel',
  },
  {
    up: migration_20260513_000000_products_rels.up,
    down: migration_20260513_000000_products_rels.down,
    name: '20260513_000000_products_rels',
  },
  {
    up: migration_20260514_000000_products_kit.up,
    down: migration_20260514_000000_products_kit.down,
    name: '20260514_000000_products_kit',
  },
  {
    up: migration_20260520_000000_products_try_on_image.up,
    down: migration_20260520_000000_products_try_on_image.down,
    name: '20260520_000000_products_try_on_image',
  },
  {
    up: migration_20260522_000000_products_enable_try_on.up,
    down: migration_20260522_000000_products_enable_try_on.down,
    name: '20260522_000000_products_enable_try_on',
  },
  {
    up: migration_20260527_000000_settings_kaspi_url.up,
    down: migration_20260527_000000_settings_kaspi_url.down,
    name: '20260527_000000_settings_kaspi_url',
  },
  {
    up: migration_20260527_120000_settings_legal_fields.up,
    down: migration_20260527_120000_settings_legal_fields.down,
    name: '20260527_120000_settings_legal_fields',
  },
];
