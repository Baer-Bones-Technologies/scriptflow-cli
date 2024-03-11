# Scriptflow CLI: Command Line Workflow Automation Tool

## Updated Versions Need to Know
<div class="sidenote">
    <h3>Release v1.0.0</h3>
    <ul>
    <li> We are now in our first major release! 🚀🚀
    </li>
    <li> This release includes a new feature that allows you to set your default text editor for the edit command, a few bug fixes, and a new announcements command that displays a list of all the updates in the current version without having to visit the changelog.
    </li>
    <li>The edit command now falls back to the default text editor set in the config file. If you have not set a default editor, you will need to specify the editor with the -openCommand (-o) or -path (-p) flag.
    </li>
    </ul>
    <div>
        <h4>Patch 1.0.2:</h4>
            <ul>
                <li>Fixed a bug that caused the edit command to not work properly. the openCommand  parameter was blocking opening</li>
                <li>Fixed a bug that caused the tutorial not to fully load.</li>
                <li> fixed a 'create' command bug that caused created flows not to run. if you are currently experiencing this issue, please run <code> flow update </code>
                </li>
        </ul>
    </div>
</div>

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

### Announcements
Stay updated with the latest changes and features:

```bash
flow news
```
<div class="sidenote">
This will list all the update >=1.0.0 announcements available to view by version. 
</div>

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

#### Updates:
<div class="sidenote">
<p> As of 1.0.0, the edit command is now open to any text editor that can be called from the terminal.
</p>
<br/>
<p>
To change your default editor use the -openCommand (-o) flag with the flow init command.
</p>
<pre>
// Open sublime text as the default editor
<br>
flow edit hello-world -o subl
</pre>
<br>
<p> If your editor is not in your PATH, you can use the -path (-p) flag to specify the path to the editor.
<br>
<pre>
// Open sublime text as the default editor
<br>
flow edit hello-world -p /Applications/Sublime\ Text.app/Contents/SharedSupport/bin/subl
</pre>

<p> After setting the default editor you can use the edit command without specifying the editor.</p>
</div>

### Set to Default
Set scriptflow to default settings, with the option to delete flows:

```bash
flow default
```
After resetting you will need to re initialize Scriptflow with ```flow init```

### Update Scriptflow CLI
Keep your Scriptflow CLI up to date with the latest version:

```bash
flow update
```
or traditionally using the npm command:

```bash
npm update -g scriptflow-cli
```

### Help
Access the help menu for a list of all available commands:

```bash
flow help
```



## Configuration
Customize your Scriptflow CLI experience by tweaking the `config.json` file, allowing adjustments in terminal profiles and default settings.

## Contributing
Join the Scriptflow CLI community! Contributions, bug reports, and feature suggestions are welcome. Visit our GitHub repository for more details.

## License
Scriptflow CLI is open-source, licensed under the MIT License. Refer to the LICENSE file for more information.