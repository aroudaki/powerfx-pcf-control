
import * as React from 'react';
import { IDisposable, MessageProcessor, PowerFxFormulaEditor } from '@microsoft/power-fx-formulabar/lib';
import { sendDataAsync } from './Helper';
import { PowerFxLanguageClient } from './PowerFxLanguageClient';

interface PowerFxEditorState {
  context: string;
  expression: string;
}

export interface EditorState {
  formula?: string;
  error?: string;
  evaluateValue?: string
}


export interface PowerFxEditorProps {
  lsp_url: string
  expression?: string;
  formulaContext?: string;
  editorMaxLine?: number;
  editorMinLine?: number;
  onEditorStateChanged?: (newState: EditorState) => void;

}

export class PowerFxEditor extends React.Component<PowerFxEditorProps, PowerFxEditorState> {
  private _languageClient: PowerFxLanguageClient;
  private _messageProcessor: MessageProcessor;
  private _listener: (data: string) => void = () => null;

  constructor(props: PowerFxEditorProps) {
    super(props);

    const onDataReceived = (data: string) => {
      this._listener(data);
    };

    this._languageClient = new PowerFxLanguageClient(this.props.lsp_url, onDataReceived);
    this._messageProcessor = {
      addListener: (listener: (data: string) => void): IDisposable => {
        this._listener = listener;
        return {
          dispose: () => null
        };
      },
      sendAsync: async (data: string): Promise<void> =>
        this._languageClient.sendAsync(data)
    };

    this.state = {
      context: this.props.formulaContext || '',
      expression: this.props.expression || ''
    };
  }

  public render() {
    const { expression } = this.state;
    const { editorMaxLine, editorMinLine } = this.props;


    return (
      <div>
        <PowerFxFormulaEditor
          getDocumentUriAsync={this._getDocumentUriAsync}
          defaultValue={expression || ''}
          messageProcessor={this._messageProcessor}
          maxLineCount={editorMaxLine || 1}
          minLineCount={editorMinLine || 1}
          onChange={this._onExpressionChanged}
          lspConfig={{
            enableSignatureHelpRequest: true
          }}
        />
      </div>
    );
  }

  private _onExpressionChanged = (newValue: string): void => {
    const { context } = this.state;
    const { onEditorStateChanged } = this.props;

    this.setState({ expression: newValue });
    onEditorStateChanged?.({ formula: newValue });
    this._evalAsync(context, newValue);
  }

  private _evalAsync = async (context: string, expression: string): Promise<void> => {
    const { lsp_url, onEditorStateChanged } = this.props;
    const result = await sendDataAsync(lsp_url, 'eval', JSON.stringify({ context, expression }));
    if (!result.ok) {
      return;
    }

    const response = await result.json();
    if (response.result) {
      onEditorStateChanged?.({ evaluateValue: response.result, error: '' });
    } else if (response.error) {
      onEditorStateChanged?.({ evaluateValue: '', error: response.error });
    } else {
      onEditorStateChanged?.({ evaluateValue: '', error: '' });
    }
  };

  private _getDocumentUriAsync = async (): Promise<string> => {
    return `powerfx://demo?context=${this.state.context}`;
  };
}
