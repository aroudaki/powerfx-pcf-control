
import * as React from "react";
import { IInputs } from "./generated/ManifestTypes";
import { EditorState, PowerFxEditor } from "./PowerFxEditor";

export interface ControlContainerProps extends React.ClassAttributes<ControlContainer> {
  onEditorStateChanged?: (newState: EditorState) => void;
  context: ComponentFramework.Context<IInputs> | null;
}

interface ControlContainerState {
  recId: string | null;
  entityName: string | null;
  entityRecordJString?: string;
}


export class ControlContainer extends React.Component<ControlContainerProps, ControlContainerState> {
  constructor(props: ControlContainerProps) {
    super(props);
    const pageURL = this.parsePageURL();

    this.state = {
      recId: pageURL.id || null,
      entityName: pageURL.etn || null
    };
  }

  public static deriveStateFromProps(props: ControlContainerProps): ControlContainerState {
    return {
      recId: (props.context as any)?.page.entityId || null,
      entityName: (props.context as any)?.page.entityTypeName || null
    }
  }

  public componentDidUpdate(prevProps: Readonly<ControlContainerProps>, prevState: Readonly<ControlContainerState>, snapshot?: any): void {
    if (!this.state.entityRecordJString) {
      this.generateRecordContext().then(entityRecordJString => {
        if (entityRecordJString !== this.state.entityRecordJString) {
          this.setState({ entityRecordJString });
        }
      })
    }
  }

  public render() {
    const { context } = this.props;
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
    const { recId, entityName } = this.state;
    const { context } = this.props;
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
    } catch {
      console.log("Error parsing URL");
    }

    return parsedURLObj;
  }
}
