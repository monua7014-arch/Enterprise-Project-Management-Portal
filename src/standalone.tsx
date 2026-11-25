import * as React from 'react';
import * as ReactDom from 'react-dom';
import { initializeIcons } from '@fluentui/react';
import App from './components/App';
import { SharePointService } from './services';
import { WebPartContext } from '@microsoft/sp-webpart-base';

// Initialize Fluent UI icon fonts for standalone browser execution
initializeIcons();

// Mock SPFx WebPartContext for public browser execution without SharePoint login
const standaloneMockContext: Partial<WebPartContext> = {
  pageContext: {
    user: {
      displayName: 'Alex Morgan (Enterprise Director)',
      email: 'alex.morgan@contoso.com',
      loginName: 'i:0#.f|membership|alex.morgan@contoso.com',
      isAnonymousGuestUser: false,
      isExternalGuestUser: false,
      preferUserTimeZone: false
    },
    web: {
      title: 'Global Delivery Operations',
      absoluteUrl: window.location.origin,
      serverRelativeUrl: '',
      id: null as any,
      language: 1033,
      languageName: 'en-US',
      templateName: 'STS#3',
      description: 'Enterprise Project Management Portal'
    },
    site: {
      absoluteUrl: window.location.origin,
      serverRelativeUrl: '',
      id: null as any
    }
  } as any,
  domElement: document.getElementById('root') as HTMLElement
};

// Initialize SharePoint Service with mock context (runs in safe, interactive client-side mode)
SharePointService.getInstance().init(standaloneMockContext as WebPartContext);

// Mount the App
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDom.render(
    React.createElement(App, { context: standaloneMockContext as WebPartContext }),
    rootElement
  );
}
