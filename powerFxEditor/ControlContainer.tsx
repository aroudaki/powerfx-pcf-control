
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
    lspServiceURL = lspServiceURL && lspServiceURL.length > 0 ? lspServiceURL : 'https://localhost:5001/';
    let formulaContext = context?.parameters.formulaContext.raw;
    formulaContext = formulaContext && formulaContext.length > 0 ? formulaContext : defaultContext;

    const containerStyle: React.CSSProperties = {
      width: context?.mode.allocatedWidth ?? 0 > 0 ? context?.mode.allocatedWidth : "400px",
      height: context?.mode.allocatedHeight ?? 0 > 0 ? context?.mode.allocatedHeight : "200px",
      position: "relative"
    }

    return (
      <div style={containerStyle}>
        <PowerFxEditor
          lsp_url={lspServiceURL}
          formula={context?.parameters.formula.raw || undefined}
          formulaContext={formulaContext}
          editorMaxLine={context?.parameters.editorMaxLine.raw || 3}
          editorMinLine={context?.parameters.editorMinLine.raw || 3}
          onEditorStateChanged={this.props.onEditorStateChanged}
        />
      </div>
    );
  }
}
