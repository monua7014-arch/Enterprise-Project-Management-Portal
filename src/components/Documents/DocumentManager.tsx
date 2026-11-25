import * as React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentService, ProjectService } from '../../services';
import { IDocumentItem, IProjectItem, DocumentCategory } from '../../models';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  SearchBox, 
  Dropdown, 
  IDropdownOption, 
  Modal, 
  TextField, 
  Spinner, 
  SpinnerSize, 
  Dialog, 
  DialogType, 
  DialogFooter 
} from '@fluentui/react';

export const DocumentManager: React.FC = () => {
  const { config, themeStyles, refreshTrigger, triggerRefresh, showToast, globalSearch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [documents, setDocuments] = useState<IDocumentItem[]>([]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProjectId, setUploadProjectId] = useState<number>(0);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('Architecture');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  // Delete dialog
  const [docToDelete, setDocToDelete] = useState<IDocumentItem | null>(null);

  useEffect(() => {
    loadData();
  }, [config, refreshTrigger]);

  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dList, pList] = await Promise.all([
        DocumentService.getInstance().getDocuments(config),
        ProjectService.getInstance().getProjects(config)
      ]);
      setDocuments(dList);
      setProjects(pList);
    } catch (err) {
      console.error('[DocumentManager] Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const p = projects.find(prj => prj.id === uploadProjectId);
      await DocumentService.getInstance().uploadDocument(
        selectedFile,
        {
          projectId: uploadProjectId || undefined,
          projectTitle: p?.title,
          category: uploadCategory,
          title: uploadTitle || selectedFile.name
        },
        config
      );
      showToast(`Document '${selectedFile.name}' stored in SharePoint.`, 'success');
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      await DocumentService.getInstance().deleteDocument(docToDelete.id, config);
      showToast(`Document '${docToDelete.name}' deleted.`, 'success');
      setDocToDelete(null);
      triggerRefresh();
    } catch (err) {
      showToast('Failed to delete document.', 'error');
    }
  };

  const categoryOptions: IDropdownOption[] = [
    { key: 'All', text: 'All Categories' },
    { key: 'Architecture', text: 'Architecture' },
    { key: 'Design', text: 'Design' },
    { key: 'Requirements', text: 'Requirements' },
    { key: 'Contract', text: 'Contract' },
    { key: 'Deliverable', text: 'Deliverable' },
    { key: 'Meeting Notes', text: 'Meeting Notes' },
    { key: 'Other', text: 'Other' }
  ];

  const projectOptions: IDropdownOption[] = [
    { key: 'All', text: 'All Projects' },
    ...projects.map(p => ({ key: String(p.id), text: p.title }))
  ];

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const matchSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.projectTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchProject = projectFilter === 'All' || String(d.projectId) === projectFilter;
      const matchCategory = categoryFilter === 'All' || d.category === categoryFilter;

      return matchSearch && matchProject && matchCategory;
    });
  }, [documents, searchQuery, projectFilter, categoryFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '16px 20px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ width: '220px' }}>
            <SearchBox
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(_, val) => setSearchQuery(val || '')}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Dropdown
              selectedKey={projectFilter}
              options={projectOptions}
              onChange={(_, opt) => opt && setProjectFilter(String(opt.key))}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Dropdown
              selectedKey={categoryFilter}
              options={categoryOptions}
              onChange={(_, opt) => opt && setCategoryFilter(String(opt.key))}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>
        </div>

        <PrimaryButton
          text="Upload Document"
          iconProps={{ iconName: 'Upload' }}
          onClick={() => {
            setUploadProjectId(projects[0]?.id || 0);
            setIsUploadOpen(true);
          }}
          styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
        />
      </div>

      {/* Documents Table */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Loading documents from SharePoint library..." />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: themeStyles.textMuted }}>
            <i className="ms-Icon ms-Icon--FabricFolder" style={{ fontSize: '36px', marginBottom: '12px', display: 'block' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No documents found</div>
            <div style={{ fontSize: '13px' }}>Upload a file to attach it to a project.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: themeStyles.bgCardHover,
                    borderBottom: `1px solid ${themeStyles.border}`,
                    color: themeStyles.textSecondary,
                    fontWeight: 600
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Document Name</th>
                  <th style={{ padding: '12px 16px' }}>Associated Project</th>
                  <th style={{ padding: '12px 16px' }}>Category</th>
                  <th style={{ padding: '12px 16px' }}>Size</th>
                  <th style={{ padding: '12px 16px' }}>Version</th>
                  <th style={{ padding: '12px 16px' }}>Modified</th>
                  <th style={{ padding: '12px 16px' }}>Author</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    style={{
                      borderBottom: `1px solid ${themeStyles.border}`,
                      backgroundColor: idx % 2 === 0 ? 'transparent' : `${themeStyles.bgCardHover}55`
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ms-Icon ms-Icon--Page" style={{ color: themeStyles.accentBlue, fontSize: '16px' }} />
                        <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                      {doc.projectTitle || 'General'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 168, 232, 0.15)',
                          color: themeStyles.accentBlue
                        }}
                      >
                        {doc.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textMuted }}>
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                      v{doc.versionLabel || '1.0'}
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textMuted }}>
                      {new Date(doc.modified).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                      {doc.author}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <IconButton
                        iconProps={{ iconName: 'Download' }}
                        title="Download / View"
                        onClick={() => window.open(doc.serverRelativeUrl, '_blank')}
                        styles={{ root: { color: themeStyles.accentBlue } }}
                      />
                      <IconButton
                        iconProps={{ iconName: 'Delete' }}
                        title="Delete Document"
                        onClick={() => setDocToDelete(doc)}
                        styles={{ root: { color: themeStyles.accentRed } }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onDismiss={() => setIsUploadOpen(false)}
        styles={{
          main: {
            width: '540px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${themeStyles.border}` }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Upload Document to SharePoint Library
          </h3>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            />
            <DefaultButton
              text={selectedFile ? `Selected: ${selectedFile.name}` : 'Choose File...'}
              iconProps={{ iconName: 'Attach' }}
              onClick={() => fileInputRef.current?.click()}
            />
          </div>

          <TextField
            label="Document Title (Optional)"
            placeholder="e.g. Solution Design Specification"
            value={uploadTitle}
            onChange={(_, val) => setUploadTitle(val || '')}
          />

          <Dropdown
            label="Associated Project"
            selectedKey={uploadProjectId}
            options={projectOptions.filter(o => o.key !== 'All')}
            onChange={(_, opt) => opt && setUploadProjectId(Number(opt.key))}
          />

          <Dropdown
            label="Document Category"
            selectedKey={uploadCategory}
            options={categoryOptions.filter(o => o.key !== 'All')}
            onChange={(_, opt) => opt && setUploadCategory(opt.key as DocumentCategory)}
          />
        </div>

        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: `1px solid ${themeStyles.border}`,
            backgroundColor: themeStyles.bgCardHover
          }}
        >
          <DefaultButton text="Cancel" onClick={() => setIsUploadOpen(false)} disabled={uploading} />
          <PrimaryButton
            text={uploading ? 'Uploading...' : 'Upload to SharePoint'}
            disabled={!selectedFile || uploading}
            onClick={handleUploadSubmit}
            styles={{ root: { backgroundColor: themeStyles.accentBlue } }}
          />
        </div>
      </Modal>

      {/* Delete Dialog */}
      <Dialog
        hidden={!docToDelete}
        onDismiss={() => setDocToDelete(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirm Document Deletion',
          subText: `Are you sure you want to delete '${docToDelete?.name}' from the SharePoint library?`
        }}
      >
        <DialogFooter>
          <PrimaryButton
            text="Delete"
            onClick={handleDeleteConfirm}
            styles={{ root: { backgroundColor: themeStyles.accentRed, borderColor: themeStyles.accentRed } }}
          />
          <DefaultButton text="Cancel" onClick={() => setDocToDelete(null)} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};
