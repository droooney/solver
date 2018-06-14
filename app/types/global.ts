import * as ReactObj from 'react';
import * as ReactDOMObj from 'react-dom';

declare global {
  var React: typeof ReactObj;
  var ReactDOM: typeof ReactDOMObj;

  interface FetchEvent {
    respondWith(response: Response): void;
  }

  interface Clipboard {
    writeText(text: string): Promise<void>;
    readText(): Promise<string>;
  }

  interface Permissions {
    query(queryObject: { name: 'clipboard-read' }): Promise<PermissionStatus>;
    query(queryObject: { name: 'clipboard-write' }): Promise<PermissionStatus>;
  }

  interface PermissionStatus {
    state: 'prompt' | 'granted' | 'denied';
  }

  interface Navigator {
    clipboard: Clipboard;
    permissions: Permissions;
  }
}
