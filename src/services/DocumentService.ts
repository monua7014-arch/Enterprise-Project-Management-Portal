import { SharePointService } from './SharePointService';
import { IDocumentItem, IListMappingConfig, DocumentCategory } from '../models';
import { INITIAL_DOCUMENTS } from './MockData';
import { ProjectService } from './ProjectService';

export class DocumentService {
  private static instance: DocumentService;
  private memoryDocuments: IDocumentItem[] = [...INITIAL_DOCUMENTS];

  private constructor() {}

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  public async getDocuments(config: IListMappingConfig, projectId?: number): Promise<IDocumentItem[]> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const libName = config.documentsLib || 'ProjectDocuments';
        if (await spService.checkListExists(libName)) {
          const sp = spService.getSP();
          let query = sp.web.lists.getByTitle(libName).items
            .select(
              'Id',
              'Title',
              'FileLeafRef',
              'FileRef',
              'File_x0020_Size',
              'Modified',
              'Author/Title',
              'ProjectLookup/Id',
              'ProjectLookup/Title',
              'DocumentCategory',
              '_UIVersionString'
            )
            .expand('Author', 'ProjectLookup')
            .top(300);

          if (projectId) {
            query = query.filter(`ProjectLookup/Id eq ${projectId}`);
          }

          const items = await query();
          return items.map(i => ({
            id: i.Id,
            name: i.FileLeafRef,
            title: i.Title || i.FileLeafRef,
            serverRelativeUrl: i.FileRef,
            fileSize: Number(i.File_x0020_Size) || 0,
            modified: i.Modified,
            author: i.Author ? i.Author.Title : 'System',
            projectId: i.ProjectLookup ? i.ProjectLookup.Id : undefined,
            projectTitle: i.ProjectLookup ? i.ProjectLookup.Title : undefined,
            category: (i.DocumentCategory as DocumentCategory) || 'Other',
            versionLabel: i._UIVersionString || '1.0'
          }));
        }
      } catch (err) {
        console.warn('[DocumentService] Could not retrieve SharePoint documents. Falling back to local store.', err);
      }
    }

    if (projectId) {
      return this.memoryDocuments.filter(d => d.projectId === projectId);
    }
    return [...this.memoryDocuments];
  }

  public async uploadDocument(
    file: File,
    metadata: { projectId?: number; projectTitle?: string; category: DocumentCategory; title?: string },
    config: IListMappingConfig
  ): Promise<IDocumentItem> {
    const spService = SharePointService.getInstance();
    let newDoc: IDocumentItem;

    if (spService.isConnected()) {
      try {
        const libName = config.documentsLib || 'ProjectDocuments';
        if (await spService.checkListExists(libName)) {
          const sp = spService.getSP();
          const lib = sp.web.lists.getByTitle(libName);
          const rootFolder = await lib.rootFolder();
          
          // Upload file buffer
          const fileResult = await sp.web.getFolderByServerRelativePath(rootFolder.ServerRelativeUrl).files.addUsingPath(file.name, file, { Overwrite: true });
          const item = await fileResult.file.getItem();
          
          const updatePayload: any = {
            Title: metadata.title || file.name,
            DocumentCategory: metadata.category
          };
          if (metadata.projectId) {
            updatePayload.ProjectLookupId = metadata.projectId;
          }
          await item.update(updatePayload);

          const itemData = await item();
          newDoc = {
            id: itemData.Id,
            name: file.name,
            title: metadata.title || file.name,
            serverRelativeUrl: fileResult.data.ServerRelativeUrl,
            fileSize: file.size,
            modified: new Date().toISOString(),
            author: spService.getContext().pageContext.user.displayName,
            projectId: metadata.projectId,
            projectTitle: metadata.projectTitle,
            category: metadata.category,
            versionLabel: '1.0'
          };
          this.memoryDocuments.unshift(newDoc);
          if (metadata.projectId) {
            ProjectService.getInstance().logActivity(metadata.projectId, 'Document Uploaded', `Document '${file.name}' uploaded.`);
          }
          return newDoc;
        }
      } catch (err) {
        console.warn('[DocumentService] Failed to upload to SharePoint library. Falling back to client-memory.', err);
      }
    }

    newDoc = {
      id: Date.now(),
      name: file.name,
      title: metadata.title || file.name,
      serverRelativeUrl: `/sites/projects/ProjectDocuments/${encodeURIComponent(file.name)}`,
      fileSize: file.size,
      modified: new Date().toISOString(),
      author: 'Current User',
      projectId: metadata.projectId,
      projectTitle: metadata.projectTitle,
      category: metadata.category,
      versionLabel: '1.0'
    };
    this.memoryDocuments.unshift(newDoc);
    if (metadata.projectId) {
      ProjectService.getInstance().logActivity(metadata.projectId, 'Document Uploaded', `Document '${file.name}' stored in catalog.`);
    }
    return newDoc;
  }

  public async deleteDocument(id: number, config: IListMappingConfig): Promise<boolean> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const libName = config.documentsLib || 'ProjectDocuments';
        if (await spService.checkListExists(libName)) {
          const sp = spService.getSP();
          await sp.web.lists.getByTitle(libName).items.getById(id).delete();
        }
      } catch (err) {
        console.warn(`[DocumentService] Could not delete SharePoint document ${id}:`, err);
      }
    }

    this.memoryDocuments = this.memoryDocuments.filter(d => d.id !== id);
    return true;
  }
}
