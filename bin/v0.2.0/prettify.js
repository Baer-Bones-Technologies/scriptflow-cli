/**
 * @fileoverview This module is made to prettify console output. It is used to make the output more readable.
 * @module prettify
 * @requires chalk
 * @requires boxen
 * 
 * @function formatError
 * @function formatSuccess
 * @function fotmatAnnouncement
 * @function formatLink
 * @function formatInfo
 */

const chalk = require('chalk');
const boxen = require('boxen');

function formatError(message) {
  return chalk.red(message);
}

function formatSuccess(message) {
    return chalk.green(message);
    }

function formatAnnouncement(message) {
    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'yellow',
        backgroundColor: 'black'
    };
    return boxen(chalk.yellow(message), boxenOptions);
}

function formatLink(message) {
    return chalk.blue.underline(message);
}

function formatInfo(message) {
    return chalk.blue(message);
}

module.exports = {
    formatError,
    formatSuccess,
    formatAnnouncement,
    formatLink
};'use strict'