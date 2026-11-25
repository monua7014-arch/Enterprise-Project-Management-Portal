import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFx, SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';
import '@pnp/sp/files';
import '@pnp/sp/folders';
import '@pnp/sp/site-users/web';
import '@pnp/sp/batching';
import { ISPListInfo, ISPFieldInfo, IUserRef } from '../models';

export class SharePointService {
  private static instance: SharePointService;
  private sp: SPFI | null = null;
  private context: WebPartContext | null = null;
  private isOnline: boolean = false;

  private constructor() {}

  public static getInstance(): SharePointService {
    if (!SharePointService.instance) {
      SharePointService.instance = new SharePointService();
    }
    return SharePointService.instance;
  }

  public init(context: WebPartContext): void {
    try {
      this.context = context;
      this.sp = spfi().using(SPFx(context));
      this.isOnline = true;
      console.log('[SharePointService] PnPjs v3 initialized successfully with SPFx context.');
    } catch (err) {
      console.warn('[SharePointService] Failed to initialize PnPjs. Operating in disconnected/fallback mode.', err);
      this.isOnline = false;
    }
  }

  public getSP(): SPFI {
    if (!this.sp) {
      throw new Error('SharePointService is not initialized. Call init(context) first.');
    }
    return this.sp;
  }

  public getContext(): WebPartContext {
    if (!this.context) {
      throw new Error('SharePoint context is not initialized.');
    }
    return this.context;
  }

  public isConnected(): boolean {
    return this.isOnline && !!this.sp;
  }

  public async checkListExists(listTitle: string): Promise<boolean> {
    if (!this.isConnected()) return false;
    try {
      await this.sp.web.lists.getByTitle(listTitle)();
      return true;
    } catch {
      return false;
    }
  }

  public async getAvailableLists(): Promise<ISPListInfo[]> {
    if (!this.isConnected()) return [];
    try {
      const lists = await this.sp.web.lists
        .select('Id', 'Title', 'ItemCount', 'BaseTemplate', 'Hidden', 'DefaultViewUrl')
        .filter('Hidden eq false')();

      return lists.map(l => ({
        id: l.Id,
        title: l.Title,
        itemCount: l.ItemCount,
        baseTemplate: l.BaseTemplate,
        hidden: l.Hidden,
        defaultViewUrl: l.DefaultViewUrl
      }));
    } catch (err) {
      console.error('[SharePointService] Error fetching available lists:', err);
      return [];
    }
  }

  public async getListFields(listTitle: string): Promise<ISPFieldInfo[]> {
    if (!this.isConnected()) return [];
    try {
      const fields = await this.sp.web.lists
        .getByTitle(listTitle)
        .fields
        .select('Id', 'InternalName', 'Title', 'TypeAsString', 'Required', 'ReadOnlyField', 'Choices')
        .filter('Hidden eq false and ReadOnlyField eq false')();

      return fields.map(f => ({
        id: f.Id,
        internalName: f.InternalName,
        title: f.Title,
        typeAsString: f.TypeAsString,
        required: f.Required,
        readOnly: f.ReadOnlyField,
        choices: f.Choices
      }));
    } catch (err) {
      console.error(`[SharePointService] Error fetching fields for list ${listTitle}:`, err);
      return [];
    }
  }

  public async resolveUser(loginOrEmail: string): Promise<IUserRef | null> {
    if (!this.isConnected()) return null;
    try {
      const user = await this.sp.web.ensureUser(loginOrEmail);
      return {
        id: user.data.Id,
        title: user.data.Title,
        email: user.data.Email
      };
    } catch (err) {
      console.warn(`[SharePointService] Could not resolve user ${loginOrEmail}:`, err);
      return null;
    }
  }

  public async getCurrentUser(): Promise<IUserRef> {
    if (this.isConnected()) {
      try {
        const u = await this.sp.web.currentUser();
        return {
          id: u.Id,
          title: u.Title,
          email: u.Email
        };
      } catch {
        // fallback to context
      }
    }
    const pc = this.context?.pageContext?.user;
    return {
      id: 1,
      title: pc?.displayName || 'Enterprise User',
      email: pc?.email || 'user@tenant.sharepoint.com'
    };
  }
}
