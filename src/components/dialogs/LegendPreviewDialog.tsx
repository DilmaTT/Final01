import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PokerMatrix } from "@/components/PokerMatrix";
import { StoredRange, Folder } from '@/types/range';
import { ActionButton as ActionButtonType } from "@/contexts/RangeContext";
import { ChartButton } from '@/types/chart';

// Helper function to get the color for a simple action
const getActionColor = (actionId: string, allButtons: ActionButtonType[]): string => {
  if (actionId === 'fold') return '#6b7280';
  const button = allButtons.find(b => b.id === actionId);
  if (button && button.type === 'simple') {
    return button.color;
  }
  return '#ffffff'; // Fallback color
};

// Helper function to get the style for any action button (simple or weighted)
const getActionButtonStyle = (button: ActionButtonType, allButtons: ActionButtonType[]) => {
  if (button.type === 'simple') {
    return { backgroundColor: button.color };
  }
  if (button.type === 'weighted') {
    const color1 = getActionColor(button.action1Id, allButtons);
    const color2 = getActionColor(button.action2Id, allButtons);
    return {
      background: `linear-gradient(to right, ${color1} ${button.weight}%, ${color2} ${button.weight}%)`,
    };
  }
  return {};
};

interface LegendPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  linkedRange: StoredRange | null | undefined;
  actionButtons: ActionButtonType[];
  editingButton: ChartButton | null;
  onSave: (newConfig: { overrides: Record<string, string>, linkButtonConfig?: ChartButton['linkButton'] }) => void;
  folders: Folder[];
}

export const LegendPreviewDialog = ({
  isOpen,
  onOpenChange,
  linkedRange,
  actionButtons,
  editingButton,
  onSave,
  folders,
}: LegendPreviewDialogProps) => {
  const [tempLegendOverrides, setTempLegendOverrides] = useState<Record<string, string>>({});
  const [linkButtonConfig, setLinkButtonConfig] = useState<ChartButton['linkButton']>(
    editingButton?.linkButton || { enabled: false, text: '', position: 'center', targetRangeId: '' }
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTempLegendOverrides(editingButton?.legendOverrides || {});
      const initialConfig = editingButton?.linkButton || { enabled: false, text: '', position: 'center', targetRangeId: '' };
      setLinkButtonConfig(initialConfig);

      if (initialConfig.targetRangeId) {
        const folder = folders.find(f => f.ranges.some(r => r.id === initialConfig.targetRangeId));
        setSelectedFolderId(folder?.id || '');
      } else {
        setSelectedFolderId(folders[0]?.id || '');
      }
    }
  }, [isOpen, editingButton, folders]);

  const handleSave = () => {
    const cleanedOverrides: Record<string, string> = {};
    for (const key in tempLegendOverrides) {
      if (tempLegendOverrides[key] && tempLegendOverrides[key].trim() !== '') {
        cleanedOverrides[key] = tempLegendOverrides[key].trim();
      }
    }
    onSave({ overrides: cleanedOverrides, linkButtonConfig });
    onOpenChange(false);
  };

  const actionsInPreviewedRange = useMemo(() => {
    if (!linkedRange) return [];
    const usedActionIds = new Set(Object.values(linkedRange.hands));
    return actionButtons.filter(action => usedActionIds.has(action.id));
  }, [linkedRange, actionButtons]);

  const rangesInSelectedFolder = useMemo(() => {
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder ? folder.ranges : [];
  }, [selectedFolderId, folders]);

  const handleFolderChange = (folderId: string) => {
    setSelectedFolderId(folderId);
    const firstRangeId = folders.find(f => f.id === folderId)?.ranges[0]?.id || '';
    setLinkButtonConfig(prev => ({ ...prev, targetRangeId: firstRangeId }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Предпросмотр и редактирование легенды</DialogTitle>
        </DialogHeader>
        {linkedRange && (
          <div>
            <PokerMatrix
              selectedHands={linkedRange.hands}
              onHandSelect={() => {}}
              activeAction=""
              actionButtons={actionButtons}
              readOnly={true}
              isBackgroundMode={false}
              sizeVariant="editorPreview"
            />
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold">Редактировать названия:</h4>
              {actionsInPreviewedRange.map(action => (
                <div key={action.id} className="grid grid-cols-[auto_1fr] items-center gap-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <div className="w-4 h-4 rounded-sm border flex-shrink-0" style={getActionButtonStyle(action, actionButtons)} />
                    <Label htmlFor={`legend-override-${action.id}`}>{action.name}:</Label>
                  </div>
                  <Input
                    id={`legend-override-${action.id}`}
                    value={tempLegendOverrides[action.id] || ''}
                    onChange={(e) => setTempLegendOverrides(prev => ({ ...prev, [action.id]: e.target.value }))}
                    placeholder={`По умолчанию: ${action.name}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold mb-3">Кнопка-ссылка на другой ренж</h4>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="enable-link-button"
                  checked={linkButtonConfig?.enabled}
                  onCheckedChange={(checked) => setLinkButtonConfig(prev => ({ ...prev, enabled: !!checked }))}
                />
                <Label htmlFor="enable-link-button">Показывать кнопку-ссылку под матрицей</Label>
              </div>

              {linkButtonConfig?.enabled && (
                <div className="space-y-4 pl-6">
                  <div>
                    <Label htmlFor="link-button-text">Текст на кнопке</Label>
                    <Input
                      id="link-button-text"
                      value={linkButtonConfig.text}
                      onChange={(e) => setLinkButtonConfig(prev => ({ ...prev, text: e.target.value }))}
                      placeholder="Напр. vs 3-bet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="link-button-position">Расположение</Label>
                    <Select
                      value={linkButtonConfig.position}
                      onValueChange={(value: 'left' | 'center' | 'right') => setLinkButtonConfig(prev => ({ ...prev, position: value }))}
                    >
                      <SelectTrigger id="link-button-position">
                        <SelectValue placeholder="Выберите расположение" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Слева</SelectItem>
                        <SelectItem value="center">По центру</SelectItem>
                        <SelectItem value="right">Справа</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Целевой ренж</Label>
                    <div className="flex gap-2">
                      <Select value={selectedFolderId} onValueChange={handleFolderChange}>
                        <SelectTrigger><SelectValue placeholder="Выберите папку" /></SelectTrigger>
                        <SelectContent>
                          {folders.map(folder => (
                            <SelectItem key={folder.id} value={folder.id}>{folder.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={linkButtonConfig.targetRangeId}
                        onValueChange={(rangeId) => setLinkButtonConfig(prev => ({ ...prev, targetRangeId: rangeId }))}
                        disabled={!selectedFolderId}
                      >
                        <SelectTrigger><SelectValue placeholder="Выберите ренж" /></SelectTrigger>
                        <SelectContent>
                          {rangesInSelectedFolder.map(range => (
                            <SelectItem key={range.id} value={range.id}>{range.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
