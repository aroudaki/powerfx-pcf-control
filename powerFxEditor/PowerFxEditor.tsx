
import * as React from 'react';
import { IDisposable, MessageProcessor, PowerFxFormulaEditor } from '@microsoft/power-fx-formulabar/lib';
import { sendDataAsync } from './lsp_helper';
import { PowerFxLanguageClient } from './PowerFxLanguageClient';

export interface EditorState {
  formula?: string;
  error?: string;
  evaluateValue?: string
}

export interface PowerFxEditorProps {
  lsp_url: string
  formula?: string;
  formulaContext?: string;
  editorMaxLine?: number;
  editorMinLine?: number;
  onEditorStateChanged?: (newState: EditorState) => void;
}

export class PowerFxEditor extends React.Component<PowerFxEditorProps, EditorState> {
  private _languageClient: PowerFxLanguageClient;
  private _messageProcessor: MessageProcessor;
  private _listener: (data: string) => void = () => null;

  constructor(props: PowerFxEditorProps) {
    super(props);

    this.state = {};

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
  }

  public static getDerivedStateFromProps(props: PowerFxEditorProps, state: EditorState): EditorState {
    return {
      formula: state.formula ?? props.formula,
      evaluateValue: state.evaluateValue ?? '',
      error: state.error ?? ''
    }
  }

  public render() {
    const { formula, evaluateValue } = this.state;
    const { editorMaxLine, editorMinLine } = this.props;

    if (formula && !evaluateValue) {
      this._evalAsync(formula);
    }



    return (
      <>
        <PowerFxFormulaEditor
          getDocumentUriAsync={this._getDocumentUriAsync}
          defaultValue={formula ?? ''}
          messageProcessor={this._messageProcessor}
          maxLineCount={editorMaxLine || 1}
          minLineCount={editorMinLine || 1}
          monacoEditorOptions={{ fixedOverflowWidgets: false }}
          onChange={this._onExpressionChanged}
          lspConfig={{
            enableSignatureHelpRequest: true
          }}
        />
        <div style={{ minHeight: 21, border: '#d2d0ce 1px solid' }}>{evaluateValue}</div>
      </>
    );
  }

  private _onExpressionChanged = (newValue: string): void => {
    const { onEditorStateChanged } = this.props;

    this.setState({ formula: newValue }, () => {
      onEditorStateChanged?.(this.state);
    });

    this._evalAsync(newValue);
  }

  private _evalAsync = async (expression: string): Promise<void> => {
    const { lsp_url, onEditorStateChanged, formulaContext } = this.props;
    const result = await sendDataAsync(lsp_url, 'eval', JSON.stringify({ context: formulaContext, expression }));
    if (!result.ok) {
      return;
    }

    const response = await result.json();
    let newState: EditorState = { formula: this.state.formula, evaluateValue: '', error: '' };
    if (response.result) {
      newState.evaluateValue = response.result;
    } else if (response.error) {
      newState.error = response.error;
    }
    onEditorStateChanged?.(newState);
    this.setState(newState);
  };

  private _getDocumentUriAsync = async (): Promise<string> => {
    return `powerfx://demo?context=${this.props.formulaContext}`;
  };
}
