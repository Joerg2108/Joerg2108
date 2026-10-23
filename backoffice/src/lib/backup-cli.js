'use strict';
// Manuelles Backup per "npm run backup" (z. B. für einen Cronjob auf dem Server)
const db = require('../db');
const backup = require('./backup');

db.open();
console.log('Backup erstellt:', backup.create('cli'));
db.close();
