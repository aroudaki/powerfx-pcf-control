import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from "react";
import { ControlContainer, ControlContainerProps } from "./ControlContainer";

export class PowerFxPCFEditor implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private _notifyOutputChanged: () => void;
    private _editorState: IOutputs

    /**
     * Empty constructor.
     */
    constructor() { }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        context.mode.trackContainerResize(true);
        this._notifyOutputChanged = notifyOutputChanged;
        this.injectCSSOverride(context);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const props: ControlContainerProps = {
            context,
            onEditorStateChanged: (editorState: IOutputs) => { this._editorState = editorState; this._notifyOutputChanged(); }
        };
        return React.createElement(ControlContainer, props);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return this._editorState
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }

    private injectCSSOverride(context: ComponentFramework.Context<IInputs>) {
        // Override the the control container style to allow overflow
        // this is needed to allow powerFx intellisense drop down to show up full size
        try {
            const controlId = (context.factory as any)._customControlProperties.controlId.split('.')[0];
            const cssOverride = document.createElement("style");
            cssOverride.innerHTML = `div[data-control-name="${controlId}"], div[data-control-name="${controlId}"] * {overflow: visible;}`;
            document.body.appendChild(cssOverride);
        } catch (error) {
            console.log(error);
        }
    }
}
