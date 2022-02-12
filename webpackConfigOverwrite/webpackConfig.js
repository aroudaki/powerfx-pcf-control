"use strict";
// Copyright (C) Microsoft Corporation. All rights reserved.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebpackConfig = exports.generateStub = exports.getNamespaceStub = void 0;
const webpack = require("webpack");
const constants = require("./constants");
const featureManager_1 = require("./featureManager");
const platformLibrariesHandler_1 = require("./platformLibrariesHandler");
const _ = require("lodash");
const path = require('path');
const fs = require('fs');
// Append a stub to webpack bundle to prevent overwriting global variables
// If different controls are using the same namespace, webpack will keep redeclaring
// the namespace as global variables. As a result, only of one the controls can be called.
// The inserted stub checks whether the namespace already exists and uses a temporary variable
// to hold the control's constructor.
function getNamespaceStub(namespace, constructor) {
    const splitNamespace = namespace.split('.');
    let stub = `\tvar ${splitNamespace[0]} = ${splitNamespace[0]} || {};\n`;
    for (let i = 1; i < splitNamespace.length; i++) {
        const littleStub = `${splitNamespace.slice(0, i + 1).join('.')}`;
        stub += `\t${littleStub} = ${littleStub} || {};\n`;
    }
    stub = stub + `\t${namespace}.${constructor} = ${constants.TEMP_NAMESPACE}.${constructor};\n` +
        `\t${constants.TEMP_NAMESPACE} = undefined;\n`;
    return stub;
}
exports.getNamespaceStub = getNamespaceStub;
// Use registration function if exists, else fall back to the stub that uses the namespace as a global variable
function generateStub(namespace, constructor) {
    return '\nif (window.ComponentFramework && window.ComponentFramework.registerControl) {\n' +
        `\tComponentFramework.registerControl('${namespace}.${constructor}', ${constants.TEMP_NAMESPACE}.${constructor});\n` +
        `} else {\n${getNamespaceStub(namespace, constructor)}}`;
}
exports.generateStub = generateStub;
function getWebpackConfig(control, controlOutputDir, buildMode, watchFlag) {
    const entryPoint = path.resolve(control.getControlPath(), control.getCodeRelativePath());
    let customConfig = {};
    const customConfigPath = path.resolve(control.getControlPath(), '..', constants.WEBPACK_CUSTOMIZATION_FILE_NAME);
    const featureMgr = new featureManager_1.FeatureManager();
    if (featureMgr.isFeatureEnabled('pcfAllowCustomWebpack') && fs.existsSync(customConfigPath)) {
        customConfig = require(customConfigPath);
    }
    const allowProjectReferences = featureMgr.isFeatureEnabled('pcfAllowProjectReferences');
    const oobConfig = {
        // `production` mode will minify, while `development` will optimize for debugging.
        mode: buildMode,
        watch: watchFlag,
        watchOptions: {
            aggregateTimeout: 500
        },
        // Tells webpack where to start walking the graph of dependencies
        entry: entryPoint,
        output: {
            // This library value control what global variable the output control is placed in.
            library: constants.TEMP_NAMESPACE,
            pathinfo: true,
            filename: constants.BUNDLE_NAME,
            path: controlOutputDir
        },
        resolve: {
            // Tell webpack which extensions to try when it is looking for a file.
            extensions: ['.ts', '.tsx', '.js', '.jsx']
        },
        module: {
            rules: [
                {
                    // Tells webpack how to load files with TS or TSX extensions.
                    test: /\.(ts|tsx)$/,
                    use: [
                        babelLoader,
                        {
                            loader: require.resolve('ts-loader'),
                            options: {
                                projectReferences: allowProjectReferences
                            }
                        }
                    ],
                    exclude: /node_modules/
                },
                {
                    // Tell webpack how to handle JS or JSX files
                    test: /\.(js|jsx)$/,
                    use: [babelLoader]
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"],
                },
                {
                    test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
                    use: ['file-loader']
                },
                { test: /\.(png|woff|woff2|eot|ttf|svg)$/, use: ['url-loader?limit=100000'] }
            ]
        },
        plugins: [
            new webpack.optimize.LimitChunkCountPlugin({
                // prevent creating split bundles, since the PCF runtime cannot handle chunked bundles
                // neither does the control manifest and our tooling have support to build and package chunked bundles (e.g. no SoPa support)
                maxChunks: 1
            })
        ]
    };
    const mergedConfig = Object.assign(Object.assign({}, oobConfig), customConfig);
    if (featureMgr.isFeatureEnabled('pcfReactControls')) {
        if (platformLibrariesHandler_1.PlatformLibrariesHandler.hasPlatformLibs(control)) {
            let platformLibrariesHandler = new platformLibrariesHandler_1.PlatformLibrariesHandler();
            let externalsForPlatformLibs = platformLibrariesHandler.getLatestVersions();
            if (mergedConfig.externals) {
                _.merge(mergedConfig.externals, externalsForPlatformLibs);
            }
            else {
                mergedConfig.externals = externalsForPlatformLibs;
            }
        }
    }
    if (customConfig.output) {
        Object.assign(mergedConfig.output, customConfig.output);
    }
    return mergedConfig;
}
exports.getWebpackConfig = getWebpackConfig;
/* tslint:disable:align */
// Some babel plugins to support modern JS and TypeScript.
const babelPlugins = [
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    require.resolve('@babel/plugin-syntax-dynamic-import')
];
// Config for babel to tell it about which browsers we are targeting.
const babelPresetEnv = [
    require.resolve('@babel/preset-env'), {
        targets: {
            esmodules: true
        }
    }
];
const babelLoader = {
    loader: require.resolve('babel-loader'),
    options: {
        sourceType: 'unambiguous',
        presets: [
            babelPresetEnv,
            [require.resolve('@babel/preset-react')]
        ],
        plugins: babelPlugins
    }
};
/* tslint:enable:align */

//# sourceMappingURL=webpackConfig.js.map
