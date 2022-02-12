
/* global ComponentFramework */
import { IInputs, IOutputs } from './generated/ManifestTypes'
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ControlContainer, ControlContainerProps } from './ControlContainer';

export class PowerFxEditor implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private _container: HTMLDivElement | null = null;
  private _rootReactContainer: ControlContainer | null = null;
  private _notifyOutputChanged: () => void;
  private _editorState: IOutputs;

  public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
    context.mode.trackContainerResize(true);
    this._notifyOutputChanged = notifyOutputChanged;

    this._container = container;
    if (!this._rootReactContainer) {
      ReactDOM.render(
        React.createElement<ControlContainerProps>(ControlContainer, {
          initialState: state,
          onEditorStateChanged: (editorState: IOutputs) => { this._editorState = editorState; this._notifyOutputChanged(); },
          ref: ref => {
            this._rootReactContainer = ref;
          }
        }),
        this._container
      );
    }
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this._rootReactContainer?.updateContext(context);
  }


  public getOutputs(): IOutputs {
    return this._editorState
  }

  public destroy(): void {
    if (this._container) {
      ReactDOM.unmountComponentAtNode(this._container);
      this._container = null;
      this._rootReactContainer = null;
    }
  }
}
