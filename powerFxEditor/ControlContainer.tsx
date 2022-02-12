
import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";
import { EditorState, PowerFxEditor } from "./PowerFxEditor";

export interface ControlContainerProps extends React.ClassAttributes<ControlContainer> {
  initialState?: ComponentFramework.Dictionary | null;
  onEditorStateChanged?: (newState: EditorState) => void;
}

interface ControlContainerState {
  context: ComponentFramework.Context<IInputs> | null;
}

export class ControlContainer extends React.Component<ControlContainerProps, ControlContainerState> {
  constructor(props: ControlContainerProps) {
    super(props);
    this.state = { context: null };
  }

  public updateContext(context: ComponentFramework.Context<IInputs>) {
    this.setState({ context });
  }

  public render() {
    const { context } = this.state;
    const defaultContext = JSON.stringify({ "A": "ABC", "B": { "Inner": 123 } });
    let lspServiceURL = context?.parameters.lspServiceURL.raw;
    lspServiceURL = lspServiceURL && lspServiceURL.length > 0 ? lspServiceURL : 'https://powerfxdemo.azurewebsites.net/'
    let formulaContext = context?.parameters.formulaContext.raw;
    formulaContext = formulaContext && formulaContext.length > 0 ? formulaContext : defaultContext;

    return (
      <div className="pa-fx-editor-container">
        <PowerFxEditor
          lsp_url={lspServiceURL}
          expression={context?.parameters.formula.raw || ''}
          formulaContext={formulaContext}
          editorMaxLine={context?.parameters.editorMaxLine.raw || 3}
          editorMinLine={context?.parameters.editorMinLine.raw || 3}
          onEditorStateChanged={this.props.onEditorStateChanged}
        />
      </div>
    );
  }
}
