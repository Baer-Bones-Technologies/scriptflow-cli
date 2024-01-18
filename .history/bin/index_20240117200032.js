#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const childProcess = require('child_process');
const yargs = require('yargs/yargs');

const { hideBin } = require('yargs/helpers');

const configFile = path.join(__dirname, 'config.json');

const loadConfig = async () => {
    try {
        const configData = await fs.readFile(configFile, 'utf-8');
        return JSON.parse(configData);
    } catch (error) {
        throw new Error('Failed to load config.json: ' + error.message);
    }
};

const saveConfig = async (config) => {
    try {
        await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
        throw new Error('Failed to save config.json: ' + error.message);
    }
};

const executeCommand = util.promisify(childProcess.exec);

const initialize = async () => {
    const config = await loadConfig();

    if (config.initialized) {
        console.log('Flow manager is already initialized.');
        return;
    }

    const terminalProfileAnswer = await inquirer.prompt({
        type: 'list',
        name: 'terminalProfile',
        message: 'Select your terminal profile:',
        choices: ['bash', 'zsh'],
        default: 'bash',
    });

    const flowLocationAnswer = await inquirer.prompt({
        type: 'input',
        name: 'flowLocation',
        message: 'Enter the path where flows will be stored:',
        default: config.flowDir,
    });

    config.terminalProfile = terminalProfileAnswer.terminalProfile;
    config.flowDir = flowLocationAnswer.flowLocation;
    config.initialized = true;

    await saveConfig(config);
    console.log('Flow manager initialized successfully!');
};

const createFlow = async () => {
    const config = await loadConfig();

    if (!config.initialized) {
        console.log('Flow manager is not initialized. Please run "flow init" to initialize it.');
        return;
    }

    const questions = [
        {
            type: 'input',
            name: 'flowName',
            message: 'Enter flow name:',
            validate: (value) => /^[a-zA-Z0-9-_]+$/.test(value) || 'Please enter a valid flow name',
        },
        {
            type: 'input',
            name: 'flowPath',
            message: 'Enter the path where the flow will be called from:',
            default: path.join(process.cwd(), config.defaultFlowPath),
            validate: async (value) => {
                try {
                    const stats = await fs.stat(value);
                    return stats.isDirectory() || 'Please enter a valid directory path';
                } catch (error) {
                    return 'Please enter a valid path';
                }
            },
        },
        {
            type: 'input',
            name: 'commands',
            message: 'Enter the commands to run (comma separated):',
        },
    ];

    const answers = await inquirer.prompt(questions);
    const { flowName, flowPath, commands } = answers;

    let scriptContent = '';
    let scriptFileExtension = '';

    switch (config.terminalProfile) {
        case 'bash':
            scriptContent = `#!/bin/bash\n\n${commands.replace(',', '\n\n')}`;
            scriptFileExtension = '.sh';
            break;
        case 'zsh':
            scriptContent = `#!/bin/zsh\n\n${commands.replace(',', '\n\n')}`;
            scriptFileExtension = '.sh';
            break;
        case 'powershell':
            // PowerShell script content
            scriptContent = `# PowerShell script content here\n\n${commands.replace(',', '\n')}`;
            scriptFileExtension = '.ps1';
            break;
        case 'cmd':
            // CMD (batch script) content
            scriptContent = `@echo off\n\n${commands.replace(',', '\n')}`;
            scriptFileExtension = '.bat';
            break;
        default:
            console.log('Invalid terminal profile selected.');
            return;
    }

    
    const commandFolder = path.join(config.flowDir, flowName);
   
    
   
   
   
};

const listFlows = async () => {
    const config = await loadConfig();

    if (!config.initialized) {
        console.log('Flow manager is not initialized. Please run "flow init" to initialize it.');
        return;
    }

    const flows = await loadFlows();
    if (flows.length === 0) {
        console.log('No flows found.');
    } else {
        console.log('List of flows:');
        flows.forEach((flow) => {
            console.log(flow.name);
        });
    }
};

const runFlow = async (flowName) => {
    const config = await loadConfig();

    if (!config.initialized) {
        console.log('Flow manager is not initialized. Please run "flow init" to initialize it.');
        return;
    }

    const flows = await loadFlows();
    const flow = flows.find((f) => f.name === flowName);

    if (!flow) {
        console.log('Flow not found');
        return;
    }

    const currentDir = process.cwd();
    process.chdir(flow.path);

    console.log('Running flow: ' + flow.name);

    try {
        const { stdout, stderr } = await executeCommand(`sh ${flow.script}`);
        console.log(stdout);
        if (stderr) {
            console.error(stderr);
        }
    } catch (error) {
        console.error('Error running flow:', error.message);
    } finally {
        process.chdir(currentDir);
        console.log('Finished.');
    }
};

const deleteFlow = async (flowName) => {
    const config = await loadConfig();

    if (!config.initialized) {
        console.log('Flow manager is not initialized. Please run "flow init" to initialize it.');
        return;
    }

    const flows = await loadFlows();
    const flowIndex = flows.findIndex((f) => f.name === flowName);

    if (flowIndex === -1) {
        console.log('Flow not found');
        return;
    }

    const flow = flows[flowIndex];

    try {
        await fs.rm(flow.script, { recursive: true });
        flows.splice(flowIndex, 1);
        await saveFlows(flows);

        console.log('Flow deleted successfully!');
    } catch (error) {
        console.error('Error deleting flow:', error.message);
    }
};

const loadFlows = async () => {
    try {
        const config = await loadConfig();
        const flowsFile = path.join(config.flowDir, 'flows.json');

        if (!await fs.access(flowsFile).then(() => true).catch(() => false)) {
            return [];
        }

        const flowsData = await fs.readFile(flowsFile, 'utf-8');
        return JSON.parse(flowsData);
    } catch (error) {
        console.error('Error loading flows:', error.message);
        return [];
    }
};

const saveFlows = async (flows) => {
    const config = await loadConfig();
    const flowsFile = path.join(config.flowDir, 'flows.json');

    try {
        await fs.writeFile(flowsFile, JSON.stringify(flows, null, 2));
    } catch (error) {
        console.error('Error saving flows:', error.message);
    }
};

yargs(hideBin(process.argv))
    .command('init', 'Initialize the flow manager', {}, initialize)
    .command('create', 'Create a new flow', {}, createFlow)
    .command('list', 'List all flows', {}, listFlows)
    .command('run <flowName>', 'Run a flow by name', {}, (argv) => runFlow(argv.flowName))
    .command('delete <flowName>', 'Delete a flow by name', {}, (argv) => deleteFlow(argv.flowName))
    .demandCommand()
    .help()
    .argv;
