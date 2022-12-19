# PowerFx PCF Control

A sample PCF control embedding PowerFx formula editor

## Setup

1. run `npm install`
2. copy `webpackConfig.js` from `webpackConfigOverwrite` folder to `node-modules\pcf-scripts` folder, overwriting the default one.
3. run `npm start`

## Building Solution

Run `msbuild /t:build restore` in the `powerFxControlSln` folder

## PowerFX

To work with this control you need to have a LSP server and provide the endpoint url to the control.
To learn more about PowerFX and how to get started with it, please visit the following links:

- See [PowerFX](https://github.com/microsoft/Power-Fx) for more information on PowerFX.
- See [PowerFX Samples](https://github.com/microsoft/power-fx-host-samples) for samples
