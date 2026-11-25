import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'ProjectPortalWebPartStrings';
import App, { IAppProps } from '../../components/App';
import { SharePointService } from '../../services';

export interface IProjectPortalWebPartProps {
  title: string;
  description: string;
}

export default class ProjectPortalWebPart extends BaseClientSideWebPart<IProjectPortalWebPartProps> {

  public async onInit(): Promise<void> {
    await super.onInit();
    // Initialize PnPjs with the active SPFx context
    SharePointService.getInstance().init(this.context);
  }

  public render(): void {
    const element: React.ReactElement<IAppProps> = React.createElement(
      App,
      {
        context: this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: 'Portal Display Title'
                }),
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
