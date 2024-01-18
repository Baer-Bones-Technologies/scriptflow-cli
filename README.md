# Scriptflow CLI: Command Line Workflow Automation Tool

Scriptflow CLI is a sophisticated command-line interface (CLI) tool specifically designed for streamlining the management and execution of custom command flows. Compatible with various terminal profiles including Bash, Zsh, PowerShell, and CMD, Scriptflow CLI simplifies creating, listing, running, deleting, and editing command sequences with ease.

## Installation
Install Scriptflow CLI globally using npm for easy access across your system:

```bash
npm install -g scriptflow-cli
```
This installation process integrates Scriptflow CLI seamlessly into your terminal, making the `flow` command globally accessible.

## Usage
Scriptflow CLI enhances your command line efficiency with the following commands:

### Initialize Scriptflow CLI
Start by initializing Scriptflow CLI to set up your preferred terminal profile and flow directory:

```bash
flow init
```

### Create a New Flow
Easily create a new command flow:

```bash
flow create
```
You'll be guided to define a flow name, path, and command sequence, culminating in a custom script tailored for your terminal environment.

### List All Flows
View all your created flows with ease:

```bash
flow list
```

### Execute a Flow
Run any predefined flow swiftly:

```bash
flow run <flowName>
```
Replace `<flowName>` with your desired flow's name.

### Delete a Flow
Remove any existing flow:

```bash
flow delete <flowName>
```
Just replace `<flowName> `with the flow you wish to delete.

### Edit a Flow
Modify any flow with your default text editor:

```bash
flow edit <flowName>
```
Change `<flowName>` to the name of the flow you intend to edit.

*Current version requires VS Code for the edit command.*

## Configuration
Customize your Scriptflow CLI experience by tweaking the `config.json` file, allowing adjustments in terminal profiles and default settings.

## Contributing
Join the Scriptflow CLI community! Contributions, bug reports, and feature suggestions are welcome. Visit our GitHub repository for more details.

## License
Scriptflow CLI is open-source, licensed under the MIT License. Refer to the LICENSE file for more information.