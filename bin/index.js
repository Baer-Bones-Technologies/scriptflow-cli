#!/usr/bin/env node

const inquirer = require('inquirer');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const childProcess = require('child_process');
const yargs = require('yargs/yargs');
const os = require('os');

const { hideBin } = require('yargs/helpers');
const { initial } = require('lodash');

const configFile = path.join(__dirname, 'config.json');

const loadConfig = async () => {
    await checkForUpdates();

    try {
        const configData = await fs.readFile(configFile, 'utf-8');
        return JSON.parse(configData);
    } catch (error) {
        throw new Error('Failed to load config.json: ' + error.message);
    }
};

const saveConfig = async (config) => {
    await checkForUpdates();

    try {
        await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
        throw new Error('Failed to save config.json: ' + error.message);
    }
};

const executeCommand = util.promisify(childProcess.exec);

const initialize = async () => {
    await checkForUpdates();

    const config = await loadConfig();

    if (config.initialized) {
        console.log('Flow manager is already initialized.');
        return;
    }

    const terminalProfileAnswer = await inquirer.prompt({
        type: 'list',
        name: 'terminalProfile',
        message: 'Select your terminal profile:',
        choices: ['bash', 'zsh', 'powershell', 'cmd'],
        default: 'bash',
    });

    const flowLocationAnswer = await inquirer.prompt({
        type: 'input',
        name: 'flowLocation',
        message: 'Enter the path where flows will be stored:',
        default: config.flowDir.replace("$USER_HOME", os.homedir()),
    });

    config.terminalProfile = terminalProfileAnswer.terminalProfile;
    config.flowDir = flowLocationAnswer.flowLocation;
    config.flowCommandDir = path.join(config.flowDir, 'commands')
    config.initialized = true;

    await saveConfig(config);
    console.log('Flow manager initialized successfully!');
};


const createFlow = async (flowName, flowPath, commands) => {
    let scriptContent = '';
    let scriptFileExtension = '';
    const config = await loadConfig();

    switch (config.terminalProfile) {
        case 'bash':
            scriptContent = `#!/bin/bash\n\n${commands.replaceAll(',', '| tee -a /dev/tty | grep -q "Error" && exit 1 || exit 0\n\n')}`;
            scriptFileExtension = '.sh';
            break;
        case 'zsh':
            scriptContent = `#!/bin/zsh\n\n${commands.replaceAll(',',  '| tee -a /dev/tty | grep -q "Error" && exit 1 || exit 0\n\n')}`;
            scriptFileExtension = '.sh';
            break;
        case 'powershell':
            // PowerShell script content
            scriptContent = `# PowerShell script content here\n\n${commands.replaceAll(',', '| tee -a /dev/tty | grep -q "Error" && exit 1 || exit 0\n')}`;
            scriptFileExtension = '.ps1';
            break;
        case 'cmd':
            // CMD (batch script) content
            scriptContent = `@echo off\n\n${commands.replaceAll(',', '| tee -a /dev/tty | grep -q "Error" && exit 1 || exit 0\n')}`;
            scriptFileExtension = '.bat';
            break;
        default:
            console.log('Invalid terminal profile selected.');
            return;
    }
    const commandFolder = path.join(config.flowCommandDir, flowName);

    try {
        await fs.mkdir(commandFolder, { recursive: true });
        const scriptFile = path.join(commandFolder, `script${scriptFileExtension}`);
        await fs.writeFile(scriptFile, scriptContent);

        const flows = await loadFlows();
        flows.push({
            name: flowName,
            path: flowPath,
            script: scriptFile,
        });

        await saveFlows(flows);

        console.log(`Flow created successfully! File location: ${scriptFile}`);
    } catch (error) {
        console.error('Error creating flow:', error.message);
    }
}
/**@param {String} flowNameEntry for naming flow */

const createFlowWithPrompt = async () => {
    await checkForUpdates();

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
            validate: async (value) => {
                try {
                    // check if flow name is valid (only alphanumeric, underscore, and dash allowed)
                    if (/^([a-zA-Z0-9_-]*)$/.test(value) !== true) {
                        return 'Please enter a valid flow name';
                    }
                    //check if flow name already exists
                    const flows = await loadFlows();
                    const flow = flows !== null ? flows.find((f) => f.name === value) : null;
                    if (flow) {
                        return 'Flow name already exists';
                    }
                    return true;
                }
                catch (error) {
                    return 'An Error Occurred: ' + error.message;
                }
            },
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
            validate: async (value) => {
                try {
                    if (value === '') {
                        return 'Please enter at least one command';
                    }
                    // if command doesn't end with comma, add it
                    if (!value.endsWith(',')) {
                        value += ',';
                    }
                    return true;
                } catch (error) {
                    return 'An Error Occurred: ' + error.message;
                }
            }
        },
    ];

    const answers = await inquirer.prompt(questions);
    const { flowName, flowPath, commands } = answers;
    createFlow(flowName, flowPath, commands);
};

const listFlows = async () => {
    await checkForUpdates();

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
    await checkForUpdates();

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

    var shellRunner;
    switch (config.terminalProfile) {
        case 'bash':
        case 'zsh':
            shellRunner = 'sh';
            break;
        case 'powershell':
            shellRunner = '';
            break;
        case 'cmd':
            shellRunner = 'cmd';
            break;
        default:
            console.log('Invalid terminal profile selected.');
            return;
    }

    try {
        const { stdout, stderr } = await executeCommand(`${shellRunner} ${flow.script}`);
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
    await checkForUpdates();

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
    await checkForUpdates();

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

const reinitialize = async () => {
    await checkForUpdates();

    // give user option to move flows to new location, or delete them, or cancel
    // if move, ask for new location
    // if delete, delete flows and ask for new location
    // if cancel, cancel

    const COMPLETED_MOVE = "Flows moved successfully!\n\nNew location:"
    const config = await loadConfig();

    //check if existing flows exist
    const flows = await loadFlows();
    if (flows.length > 0) {
        const verificationAnswer = await inquirer.prompt({
            type: 'list',
            name: 'verification',
            message: 'You are about to reinitialize the flow manager. What would you like to do with existing flows?',
            choices: ['Move To New Location', 'Delete Existing Flows', 'Cancel'],
            default: 'Move To New Location',
        });

        switch (verificationAnswer.verification) {
            case 'Move To New Location':
                const newFlowLocationAnswer = await inquirer.prompt({
                    type: 'input',
                    name: 'flowLocation',
                    message: 'Enter the path where flows will be stored:',
                    default: config.flowDir.replace("$USER_HOME", os.homedir()),
                });
                //move flow folder to new location recursively
                const execSync = require('child_process').execSync;
                switch (config.terminalProfile) {
                    case 'bash':
                    case 'zsh':
                        execSync(`mv ${config.flowDir} ${newFlowLocationAnswer.flowLocation}; echo ${COMPLETED_MOVE}${newFlowLocationAnswer.flowLocation}`);
                        break;
                    case 'powershell':
                        execSync(`Move-Item -Path ${config.flowDir} -Destination ${newFlowLocationAnswer.flowLocation}; echo ${COMPLETED_MOVE}${newFlowLocationAnswer.flowLocation}`);
                        break;
                    case 'cmd':
                        execSync(`move ${config.flowDir} ${newFlowLocationAnswer.flowLocation}; echo ${COMPLETED_MOVE}${newFlowLocationAnswer.flowLocation}`);
                        break;
                    default:
                        console.log('Invalid terminal profile selected.');
                }
                //update config
                config.flowDir = newFlowLocationAnswer.flowLocation;
                config.flowCommandDir = path.join(config.flowDir, 'commands')
                config.initialized = true;
                await saveConfig(config);
                break;
            case 'Delete Existing Flows':
                //delete flows folder
                const exec = require('child_process').exec;

                switch (config.terminalProfile) {
                    case 'bash':
                    case 'zsh':
                        exec(`rm -rf ${config.flowDir}`);
                        break;
                    case 'powershell':
                        exec(`Remove-Item -Recurse -Force ${config.flowDir}`);
                        break;
                    case 'cmd':
                        exec(`rmdir /s /q ${config.flowDir}`);
                        break;
                    default:
                        console.log('Invalid terminal profile selected.');
                        return;
                }

                //update config
                config.initialized = false;
                await saveConfig(config);

                //reinitialize
                await initialize();
                break;
            case 'Cancel':
                return;
        }
    }
}

const openFlowForEditing = async (flowName) => {
    await checkForUpdates();
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

    console.log('Opening flow for editing: ' + flow.name);

    try {
        const { stdout, stderr } = await executeCommand(`code ${flow.script}`);
        console.log(stdout);
        if (stderr) {
            console.error(stderr);
        }
    } catch (error) {
        console.error('Error opening flow for editing:', error.message);
    } finally {
        process.chdir(currentDir);
        console.log('Finished.');
    }
}

const checkForUpdates = async () => {
    const { stdout, stderr } = await executeCommand('npm view scriptflow-cli version');
    const latestVersion = stdout.trim();

    if (latestVersion !== require('../package.json').version) {
        console.log('A new version of scriptflow-cli is available. Run "npm i -g scriptflow-cli" to update.');
    }
}

const resetConfig = async () => {
    const config = await loadConfig();
    config.flowDir = path.join(os.homedir(), '.flow');
    config.flowCommandDir = path.join(config.flowDir, 'commands')
    config.terminalProfile = 'bash';
    config.defaultFlowPath = '.';
    config.initialized = false;
    await saveConfig(config);
}

const viewConfig = async () => {
    const config = await loadConfig();
    console.log(config);
}

//update via npm
const update = async () => {
    //get current config
    const config = await loadConfig();

    //update scriptflow-cli
    const { stdout, stderr } = await executeCommand('npm i -g . | grep -q "Error" && exit 1 || exit 0');
    console.log(stdout);
    if (stderr) {
        console.error(stderr);
    }

    // get flows and update them
    const flows = await loadFlows();
    for (const flow of flows) {
        const scriptFile = flow.script;
        const scriptContent = await fs.readFile(scriptFile, 'utf-8');
        // Update from v0.0.3 to v0.0.4
        //replace shebang with blank
        scriptContent = scriptContent.replace('\#.*\n\n', '');
        if(!scriptContent.includes('| tee -a /dev/tty | grep -q "Error" && exit 1 || exit 0\n\n')){
        // replace '\n\n' with ','
        scriptContent = scriptContent.replaceAll('\n\n', ',');
        } else {
             continue;
        }
        createFlow(flow.name, flow.path, scriptContent);
    }

    saveConfig(config);
    // log success and any breaking changes needed to be made.
    console.log('Flow manager updated successfully!');
    console.log('Please check for any breaking changes in the latest version and update your flows accordingly.:\nhttps://github.com/ScriptFlow/scriptflow-cli/releases');
}

yargs(hideBin(process.argv))
    .command('init', 'Initialize the flow manager', {}, initialize)
    .command('create', 'Create a new flow', {}, createFlowWithPrompt)
    .command('list', 'List all flows', {}, listFlows)
    .command('run <flowName>', 'Run a flow by name', {}, (argv) => runFlow(argv.flowName))
    .command('delete <flowName>', 'Delete a flow by name', {}, (argv) => deleteFlow(argv.flowName))
    .command('reinit', 'Reinitialize the flow manager', {}, reinitialize)
    .command('edit <flowName>', 'Open a flow for editing', {}, (argv) => openFlowForEditing(argv.flowName))
    .command('default', 'Reset the flow manager config', {}, resetConfig)
    .command('config', 'View the flow manager config', {}, viewConfig)
    .command('update', 'Update the flow manager', {}, update)
    .demandCommand()
    .help()
    .argv;
