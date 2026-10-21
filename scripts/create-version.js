#!/usr/bin/env node

const DocumentationVersioning = require('./documentation-versioning.js');

const args = process.argv.slice(2);
const version = args[0];
const message = args[1] || `Documentation version ${version || 'auto'}`;

const versioning = new DocumentationVersioning();

if (version) {
  versioning.createVersion(version, { message });
} else {
  versioning.createVersion(null, { message });
}
