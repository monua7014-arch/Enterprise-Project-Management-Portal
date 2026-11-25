import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SharePointService } from '../../services';
import { ISPListInfo, ISPFieldInfo } from '../../models';
import { 
  TextField, 
  PrimaryButton, 
  DefaultButton, 
  Dropdown, 
  IDropdownOption, 
  Spinner, 
  SpinnerSize, 
  MessageBar, 
  MessageBarType 
} from '@fluentui/react';

export const DynamicConfig: React.FC = () => {
  const { config, updateConfig, themeStyles, showToast } = useApp();
  const [loading, setLoading] = useState<boolean>(false);
  const [availableLists, setAvailableLists] = useState<ISPListInfo[]>([]);
  const [selectedListForFields, setSelectedListForFields] = useState<string>(config.projectsList);
  const [fields, setFields] = useState<ISPFieldInfo[]>([]);
  const [webhookUrl, setWebhookUrl] = useState<string>(config.powerAutomateWebhookUrl || '');
  const [listNames, setListNames] = useState({
    projectsList: config.projectsList,
    tasksList: config.tasksList,
    milestonesList: config.milestonesList,
    approvalsList: config.approvalsList,
    teamList: config.teamList,
    documentsLib: config.documentsLib
  });

  useEffect(() => {
    discoverSiteLists();
  }, []);

  useEffect(() => {
    if (selectedListForFields) {
      inspectFields(selectedListForFields);
    }
  }, [selectedListForFields]);

  const discoverSiteLists = async () => {
    setLoading(true);
    try {
      const sp = SharePointService.getInstance();
      const lists = await sp.getAvailableLists();
      setAvailableLists(lists);
    } catch (err) {
      console.error('[DynamicConfig] Error discovering lists:', err);
    } finally {
      setLoading(false);
    }
  };

  const inspectFields = async (listTitle: string) => {
    try {
      const sp = SharePointService.getInstance();
      const listFields = await sp.getListFields(listTitle);
      setFields(listFields);
    } catch (err) {
      console.error('[DynamicConfig] Error fetching fields:', err);
    }
  };

  const handleSaveConfig = () => {
    updateConfig({
      ...listNames,
      powerAutomateWebhookUrl: webhookUrl
    });
    showToast('Dynamic SharePoint schema configuration updated successfully!', 'success');
  };

  const listOptions: IDropdownOption[] = availableLists.map(l => ({
    key: l.title,
    text: `${l.title} (${l.itemCount} items)`
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      {/* Intro Notice */}
      <MessageBar
        messageBarType={MessageBarType.info}
        styles={{ root: { borderRadius: '8px', border: `1px solid ${themeStyles.border}` } }}
      >
        <strong>Dynamic SharePoint Metadata Architecture:</strong> This portal eliminates hardcoded list dependencies. You can discover any SharePoint list, verify column types (Text, Number, Date, Lookup, User/Person), and map your data architecture dynamically.
      </MessageBar>

      {/* Grid of Configuration Sections */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Section 1: SharePoint List & Library Mapping */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
              SharePoint List & Library Target Mapping
            </h3>
            <DefaultButton
              text="Refresh Discovery"
              iconProps={{ iconName: 'Sync' }}
              onClick={discoverSiteLists}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <TextField
              label="Projects List Name"
              value={listNames.projectsList}
              onChange={(_, val) => setListNames(prev => ({ ...prev, projectsList: val || '' }))}
              description="Default: 'Projects'"
            />
            <TextField
              label="Tasks List Name"
              value={listNames.tasksList}
              onChange={(_, val) => setListNames(prev => ({ ...prev, tasksList: val || '' }))}
              description="Default: 'ProjectTasks'"
            />
            <TextField
              label="Milestones List Name"
              value={listNames.milestonesList}
              onChange={(_, val) => setListNames(prev => ({ ...prev, milestonesList: val || '' }))}
              description="Default: 'ProjectMilestones'"
            />
            <TextField
              label="Approvals List Name"
              value={listNames.approvalsList}
              onChange={(_, val) => setListNames(prev => ({ ...prev, approvalsList: val || '' }))}
              description="Default: 'ProjectApprovals'"
            />
            <TextField
              label="Team Allocation List Name"
              value={listNames.teamList}
              onChange={(_, val) => setListNames(prev => ({ ...prev, teamList: val || '' }))}
              description="Default: 'ProjectTeam'"
            />
            <TextField
              label="Project Documents Library Name"
              value={listNames.documentsLib}
              onChange={(_, val) => setListNames(prev => ({ ...prev, documentsLib: val || '' }))}
              description="Default: 'ProjectDocuments' (Document Library)"
            />
          </div>

          <div style={{ marginTop: '20px' }}>
            <PrimaryButton
              text="Save Configuration"
              iconProps={{ iconName: 'Save' }}
              onClick={handleSaveConfig}
              styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '8px' } }}
            />
          </div>
        </div>

        {/* Section 2: Power Automate & Column Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Power Automate Webhook */}
          <div
            style={{
              padding: '24px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '12px'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Power Automate Workflow Webhook
            </h3>
            <div style={{ fontSize: '12.5px', color: themeStyles.textSecondary, marginBottom: '16px' }}>
              When an approval is submitted or reviewed, the portal invokes this HTTP trigger endpoint to dispatch enterprise email notifications and Teams cards.
            </div>

            <TextField
              label="HTTP POST Trigger URL"
              placeholder="https://prod-XX.westus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?..."
              value={webhookUrl}
              onChange={(_, val) => setWebhookUrl(val || '')}
            />

            <div style={{ marginTop: '14px' }}>
              <DefaultButton
                text="Save Webhook"
                iconProps={{ iconName: 'PlugConnected' }}
                onClick={handleSaveConfig}
                styles={{ root: { borderRadius: '6px' } }}
              />
            </div>
          </div>

          {/* Real-time Field & Column Inspector */}
          <div
            style={{
              padding: '24px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '12px',
              flex: 1
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
              SharePoint Field & Column Type Inspector
            </h3>
            <div style={{ fontSize: '12.5px', color: themeStyles.textSecondary, marginBottom: '14px' }}>
              Select a discovered list to inspect its columns, internal names, and schema types.
            </div>

            {availableLists.length > 0 ? (
              <Dropdown
                label="Discovered SharePoint Lists"
                selectedKey={selectedListForFields}
                options={listOptions}
                onChange={(_, opt) => opt && setSelectedListForFields(String(opt.key))}
                styles={{ root: { marginBottom: '14px' } }}
              />
            ) : (
              <div style={{ fontSize: '12px', color: themeStyles.textMuted, marginBottom: '14px' }}>
                Local/Mock workbench mode active. Connected tenant lists will be listed automatically when hosted in SharePoint Online.
              </div>
            )}

            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: `1px solid ${themeStyles.border}`,
                borderRadius: '8px',
                padding: '8px'
              }}
            >
              {fields.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {fields.map(f => (
                    <div
                      key={f.id}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: themeStyles.bgCardHover,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px'
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>{f.title}</span>
                        <span style={{ color: themeStyles.textMuted, marginLeft: '6px', fontSize: '11px' }}>
                          ({f.internalName})
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 168, 232, 0.15)',
                          color: themeStyles.accentBlue,
                          fontWeight: 600
                        }}
                      >
                        {f.typeAsString}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: themeStyles.textMuted, fontSize: '12px' }}>
                  Select an active list to display field metadata.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
