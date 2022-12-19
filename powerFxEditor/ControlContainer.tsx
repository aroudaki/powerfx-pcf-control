
import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";
import { EditorState, PowerFxEditor } from "./PowerFxEditor";

export interface ControlContainerProps extends React.ClassAttributes<ControlContainer> {
  initialState?: ComponentFramework.Dictionary | null;
  onEditorStateChanged?: (newState: EditorState) => void;
}

interface ControlContainerState {
  context: ComponentFramework.Context<IInputs> | null;
  recId: string | null;
  entityName: string | null;
  entityRecordJString?: string;
}


export class ControlContainer extends React.Component<ControlContainerProps, ControlContainerState> {
  constructor(props: ControlContainerProps) {
    super(props);
    const pageURL = this.parsePageURL();

    this.state = {
      context: null,
      recId: pageURL.id || null,
      entityName: pageURL.etn || null
    };
  }

  public async updateContext(context: ComponentFramework.Context<IInputs>) {
    if (this.state.entityRecordJString) {
      this.setState({ context });
    } else {
      const entityRecordJString = await this.generateRecordContext();
      this.setState({ context, entityRecordJString });
    }
  }

  public render() {
    const { context } = this.state;
    let lspServiceURL = context?.parameters.lspServiceURL.raw;

    let formulaContext: string | undefined;
    const formulaContextProp = context?.parameters.formulaContext.raw
    if (formulaContextProp && formulaContextProp.length > 0) {
      formulaContext = formulaContextProp;
    } else if (this.state.entityRecordJString) {
      formulaContext = this.state.entityRecordJString;
    }

    if (!lspServiceURL) {
      return <div>No LSP endpoint provided.</div>
    }

    if (!formulaContext) {
      return <div>Loading record context ...</div>
    }

    return (
      <div className="pa-fx-editor-container">
        <PowerFxEditor
          lsp_url={lspServiceURL}
          formula={context?.parameters.formula.raw || ''}
          formulaContext={formulaContext}
          editorMaxLine={context?.parameters.editorMaxLine.raw || 3}
          editorMinLine={context?.parameters.editorMinLine.raw || 3}
          onEditorStateChanged={this.props.onEditorStateChanged}
        />
      </div>
    );
  }

  private async generateRecordContext() {
    const { context, recId, entityName } = this.state;
    if (context && recId && entityName) {
      const rawEntityRecord = await context.webAPI.retrieveRecord(entityName, recId);
      const entityRecord: ComponentFramework.WebApi.Entity = {};
      for (const key of Object.keys(rawEntityRecord)) {
        if (!key.startsWith("_") && key.indexOf("@") === -1 && key.indexOf(".") === -1) {
          entityRecord[key] = rawEntityRecord[key];
        }
      }
      return JSON.stringify(entityRecord);
    }
  }

  private parsePageURL(): { [key: string]: string } {
    const parsedURLObj: { [key: string]: string } = {};

    try {
      const urlParams = window.location.href.split("?")[1];
      if (urlParams) {
        const urlParamSections = urlParams.split("&");
        for (let paramPairStr of urlParamSections) {
          const paramPair = paramPairStr.split("=");
          parsedURLObj[paramPair[0]] = paramPair[1];
        }
      }
    } catch { }


    return parsedURLObj;
  }
}
