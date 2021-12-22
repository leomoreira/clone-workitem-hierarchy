# Azure DevOps Clone Work Item Extension

This repository generates an [Azure DevOps extension](https://docs.microsoft.com/en-us/azure/devops/extend/overview?view=vsts) for cloning a work item hierarchy, what surprisingly  is not supported by the default clone functionality and it is based on the [Azure DevOps extension](https://github.com/microsoft/azure-devops-extension-sample) menu sample.

The extension adds a menu option to the work item menus, when clicked the hierarchy will be cloned and the parent/chield link kept from that level downwards.

The feature is available to be enabled/disabled into the preview menu options also.

--pic1--

And it can be enabled or disabled using the preview menu:

--pic2--

## Content

The clone-workitem-hierarchy contribution is based on three main files contained folders under `./src/CWIH`, where you'll you will find:

1. `Menu.json` - describes the contribution objects being added to Azure DevOps
2. `Menu.html` - page which is rendered within an iframe on the appropriate Azure DevOps page, as it is a background iframe this will include a reference for `Menu.js`.
3. `Menu.ts(x)` - Root script that is run when the frame is loaded. A webpack entry is added for this file which will generate a single `js` file with this content and all its dependencies.

You can find the full documentation on of the used samples into Microsoft's GitHub page, see references, specifically for this, Feature and Menu samples were used to build this extension.

## Dependencies

This repository depends on a few Azure DevOps packages:

- [azure-devops-extension-sdk](https://github.com/Microsoft/azure-devops-extension-sdk): Required module for Azure DevOps extensions which allows communication between the host page and the extension iframe.
- [azure-devops-extension-api](https://github.com/Microsoft/azure-devops-extension-api): Contains REST client libraries for the various Azure DevOps feature areas.
- [azure-devops-ui](https://developer.microsoft.com/azure-devops): UI library containing the React components used in the Azure DevOps web UI.

Some external dependencies:

- `React` - Is used to render the UI, and is a dependency of `azure-devops-ui`.
- `TypeScript` - The extension was  written in TypeScript and complied to JavaScript
- `SASS` - Extension are styled using SASS (which is compiled to CSS and delivered in webpack js bundles).
- `webpack` - Is used to gather dependencies into a single javascript bundle.

## Building the project

Just run:

    npm run build

This produces a .vsix file which can be uploaded to the [Visual Studio Marketplace](https://marketplace.visualstudio.com/azuredevops)

# References

The full set of documentation for developing extensions can be found at [https://docs.microsoft.com/en-us/azure/devops/extend](https://docs.microsoft.com/en-us/azure/devops/extend/?view=vsts).

[Azure DevOps extension](https://github.com/microsoft/azure-devops-extension-sample)

# Contributing

This project welcomes contributions and suggestions.