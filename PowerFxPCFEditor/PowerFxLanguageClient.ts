
import { sendDataAsync } from './lsp_helper';

export class PowerFxLanguageClient {
  public constructor(private _lsp_url: string, private _onDataReceived: (data: string) => void) {
  }

  public async sendAsync(data: string) {
    console.log('[LSP Client] Send: ' + data);

    try {
      const result = await sendDataAsync(this._lsp_url, 'lsp', data);
      if (!result.ok) {
        return;
      }

      const response = await result.text();
      if (response) {
        const responseArray = JSON.parse(response);
        responseArray.forEach((item: string) => {
          console.log('[LSP Client] Receive: ' + item);
          this._onDataReceived(item);
        })
      }
    } catch (err) {
      console.log(err);
    }
  }
}
