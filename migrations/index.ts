import * as migration_20261031_203508_initial from './20261031_203508_initial';
import * as migration_20261031_232549_members from './20261031_232549_members';
import * as migration_20261102_233009_roles_projects from './20261102_233009_roles_projects';

export const migrations = [
  {
    up: migration_20261031_203508_initial.up,
    down: migration_20261031_203508_initial.down,
    name: '20261031_203508_initial',
  },
  {
    up: migration_20261031_232549_members.up,
    down: migration_20261031_232549_members.down,
    name: '20261031_232549_members',
  },
  {
    up: migration_20261102_233009_roles_projects.up,
    down: migration_20261102_233009_roles_projects.down,
    name: '20261102_233009_roles_projects'
  },
];
