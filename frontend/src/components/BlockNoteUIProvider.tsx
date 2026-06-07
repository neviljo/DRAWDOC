import { type ReactNode } from "react";
import { ComponentsContext } from "@blocknote/react";

interface ToolbarRootProps {
  className?: string;
  children?: ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  variant?: "default" | "action-toolbar";
}

interface ToolbarButtonProps {
  className?: string;
  mainTooltip?: string;
  secondaryTooltip?: string;
  icon?: ReactNode;
  onClick?: (e: MouseEvent) => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  variant?: "default" | "compact";
  children?: ReactNode;
  label?: string;
}

interface ToolbarSelectProps {
  className?: string;
  items: { text: string; icon: ReactNode; onClick: () => void; isSelected: boolean; isDisabled?: boolean }[];
  isDisabled?: boolean;
}

interface SuggestionMenuRootProps { id: string; className?: string; children?: ReactNode }
interface SuggestionMenuEmptyProps { className?: string; children?: ReactNode }
interface SuggestionMenuItemProps { className?: string; id: string; isSelected: boolean; onClick: () => void; item: any }
interface SuggestionMenuLabelProps { className?: string; children?: ReactNode }
interface SuggestionMenuLoaderProps { className?: string }
interface GridSuggestionMenuRootProps { id: string; columns: number; className?: string; children?: ReactNode }
interface GridSuggestionMenuEmptyProps { columns: number; className?: string; children?: ReactNode }
interface GridSuggestionMenuItemProps { className?: string; id: string; isSelected: boolean; onClick: () => void; item: any }

interface TableHandleRootProps { className?: string; draggable: boolean; onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void; style?: React.CSSProperties; children?: ReactNode; label?: string }
interface TableHandleExtendButtonProps { className?: string; onClick: (e: React.MouseEvent) => void; onMouseDown: (e: React.MouseEvent) => void; children: ReactNode }

interface FilePanelRootProps { className?: string; tabs: { name: string; tabPanel: ReactNode }[]; openTab: string; setOpenTab: (name: string) => void; defaultOpenTab: string; loading: boolean }
interface FilePanelButtonProps { className?: string; onClick: () => void; children?: ReactNode; label?: string }
interface FilePanelFileInputProps { className?: string; accept: string; value: File | null; placeholder: string; onChange: (payload: File | null) => void }
interface FilePanelTabPanelProps { className?: string; children?: ReactNode }
interface FilePanelTextInputProps { className?: string; value: string; placeholder: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; onKeyDown: (event: React.KeyboardEvent) => void }

interface LinkToolbarRootProps { className?: string; children?: ReactNode; onMouseEnter?: () => void; onMouseLeave?: () => void; variant?: "default" | "action-toolbar" }
interface LinkToolbarButtonProps { className?: string; mainTooltip?: string; secondaryTooltip?: string; icon?: ReactNode; onClick?: (e: MouseEvent) => void; isSelected?: boolean; isDisabled?: boolean; variant?: "default" | "compact"; children?: ReactNode; label?: string }
interface LinkToolbarSelectProps { className?: string; items: { text: string; icon: ReactNode; onClick: () => void; isSelected: boolean; isDisabled?: boolean }[]; isDisabled?: boolean }

interface SideMenuRootProps { className?: string; children?: ReactNode }
interface SideMenuButtonProps { className?: string; onClick?: (e: MouseEvent) => void; icon?: ReactNode; onDragStart?: (e: React.DragEvent) => void; onDragEnd?: (e: React.DragEvent) => void; draggable?: boolean; children?: ReactNode; label?: string }

interface CommentCardProps { className?: string; headerText?: string; selected?: boolean; onFocus?: (event: React.FocusEvent) => void; onBlur?: (event: React.FocusEvent) => void; tabIndex?: number; children?: ReactNode }
interface CommentCardSectionProps { className?: string; children?: ReactNode }
interface CommentExpandSectionProps { className?: string; children?: ReactNode }
interface CommentEditorProps { className?: string; autoFocus?: boolean; editable: boolean; editor: any; onFocus?: () => void; onBlur?: () => void; children?: ReactNode }
interface CommentCommentProps { className?: string; children?: ReactNode; authorInfo: "loading" | any; timeString: string; edited: boolean; actions?: ReactNode; showActions?: boolean | "hover"; emojiPickerOpen?: boolean }

interface BadgeRootProps { className?: string; text: string; icon?: ReactNode; isSelected?: boolean; mainTooltip?: string; secondaryTooltip?: string; onClick?: (event: React.MouseEvent) => void; onMouseEnter?: () => void }
interface BadgeGroupProps { className?: string; children: ReactNode }
interface FormRootProps { children?: ReactNode }
interface FormTextInputProps { className?: string; name: string; label?: string; variant?: "default" | "large"; icon: ReactNode; rightSection?: ReactNode; autoFocus?: boolean; placeholder?: string; disabled?: boolean; value: string; onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; onSubmit?: () => void; autoComplete?: string; "aria-activedescendant"?: string; ref?: any }
interface MenuRootProps { sub?: boolean; onOpenChange?: (open: boolean) => void; position?: string; children?: ReactNode }
interface MenuDividerProps { className?: string }
interface MenuDropdownProps { className?: string; children?: ReactNode; sub?: boolean }
interface MenuItemProps { className?: string; children?: ReactNode; subTrigger?: boolean; icon?: ReactNode; checked?: boolean; onClick?: () => void }
interface MenuLabelProps { className?: string; children?: ReactNode }
interface MenuTriggerProps { children?: ReactNode; sub?: boolean }
interface MenuButtonProps { className?: string; onClick?: (e: MouseEvent) => void; icon?: ReactNode; onDragStart?: (e: React.DragEvent) => void; onDragEnd?: (e: React.DragEvent) => void; draggable?: boolean; children?: ReactNode; label?: string }
interface PopoverRootProps { open?: boolean; onOpenChange?: (open: boolean) => void; position?: string; portalRoot?: HTMLElement | null; children?: ReactNode }
interface PopoverContentProps { className?: string; variant: "form-popover" | "panel-popover"; children?: ReactNode }
interface PopoverTriggerProps { children?: ReactNode }
interface ToolbarRootProps { className?: string; children?: ReactNode; onMouseEnter?: () => void; onMouseLeave?: () => void; variant?: "default" | "action-toolbar" }
interface ToolbarButtonProps { className?: string; mainTooltip?: string; secondaryTooltip?: string; icon?: ReactNode; onClick?: (e: MouseEvent) => void; isSelected?: boolean; isDisabled?: boolean; variant?: "default" | "compact"; children?: ReactNode; label?: string }
interface ToolbarSelectProps { className?: string; items: { text: string; icon: ReactNode; onClick: () => void; isSelected: boolean; isDisabled?: boolean }[]; isDisabled?: boolean }

function ToolbarBtn(p: ToolbarButtonProps) {
  return (
    <button
      title={p.mainTooltip}
      disabled={p.isDisabled}
      onClick={p.onClick as any}
      className={p.className}
      style={{
        background: p.isSelected ? "#3b3b3b" : "transparent",
        border: "1px solid transparent",
        borderRadius: 4, padding: "3px 6px",
        cursor: p.isDisabled ? "not-allowed" : "pointer",
        color: p.isSelected ? "#fff" : "#b0b0b0",
        opacity: p.isDisabled ? 0.35 : 1,
        display: "inline-flex", alignItems: "center", gap: 4,
      }}
    >
      {p.icon}{p.children}
    </button>
  );
}

function ToolbarSel(p: ToolbarSelectProps) {
  return (
    <select
      className={p.className}
      disabled={p.isDisabled}
      onChange={(e) => p.items[+e.target.value]?.onClick()}
      style={{
        background: "#1e1e1e", border: "1px solid #333",
        borderRadius: 4, padding: "3px 6px", color: "#ccc",
        fontSize: 13,
      }}
    >
      {p.items?.map((item, i) => (
        <option key={i} value={i} selected={item.isSelected}>{item.text}</option>
      ))}
    </select>
  );
}

function ToolbarRoot(p: ToolbarRootProps) {
  return (
    <div
      className={p.className}
      onMouseEnter={p.onMouseEnter}
      onMouseLeave={p.onMouseLeave}
      style={{
        display: "flex", gap: 4, padding: "4px 6px",
        alignItems: "center", background: "#252525",
        borderRadius: 8, border: "1px solid #333",
      }}
    >
      {p.children}
    </div>
  );
}

function SideRoot(p: SideMenuRootProps) { return <div className={p.className} style={{ padding: 2 }}>{p.children}</div>; }

function SideBtn(p: SideMenuButtonProps) {
  return (
    <div
      className={p.className}
      draggable={p.draggable}
      onClick={p.onClick as any}
      onDragStart={p.onDragStart as any}
      onDragEnd={p.onDragEnd as any}
      style={{
        cursor: "grab", padding: 4, borderRadius: 4,
        color: "#666", display: "flex", alignItems: "center",
      }}
    >
      {p.icon}{p.children}
    </div>
  );
}

function SuggRoot(p: SuggestionMenuRootProps) {
  return (
    <div
      id={p.id}
      className={p.className}
      style={{
        background: "#252525", border: "1px solid #333",
        borderRadius: 8, padding: 4, minWidth: 200,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {p.children}
    </div>
  );
}

function SuggItem(p: SuggestionMenuItemProps) {
  return (
    <button
      id={p.id}
      className={p.className}
      onClick={p.onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "6px 10px", border: "none", borderRadius: 4,
        background: p.isSelected ? "#3b3b3b" : "transparent",
        color: "#ddd", cursor: "pointer", fontSize: 14, textAlign: "left",
      }}
    >
      {p.item.icon && <span>{p.item.icon({})}</span>}
      <span>{p.item.text || p.item.title}</span>
    </button>
  );
}

function SuggLabel(p: SuggestionMenuLabelProps) {
  return <div className={p.className} style={{ padding: "4px 10px", fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{p.children}</div>;
}

function SuggLoader(p: SuggestionMenuLoaderProps) {
  return <div className={p.className} style={{ padding: 12, textAlign: "center", color: "#666" }}>Loading...</div>;
}

function SuggEmpty(p: SuggestionMenuEmptyProps) {
  return <div className={p.className} style={{ padding: 12, textAlign: "center", color: "#666" }}>{p.children || "No results"}</div>;
}

function GridSuggRoot(p: GridSuggestionMenuRootProps) {
  return (
    <div
      id={p.id}
      className={p.className}
      style={{
        display: "grid", gridTemplateColumns: `repeat(${p.columns}, 1fr)`,
        gap: 2, padding: 4, background: "#252525",
        border: "1px solid #333", borderRadius: 8, minWidth: 280,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {p.children}
    </div>
  );
}

function GridSuggItem(p: GridSuggestionMenuItemProps) {
  return (
    <button
      id={p.id}
      className={p.className}
      onClick={p.onClick}
      style={{
        padding: 8, border: "none", borderRadius: 4,
        background: p.isSelected ? "#3b3b3b" : "transparent",
        color: "#ddd", cursor: "pointer", fontSize: 22, textAlign: "center",
      }}
    >
      {p.item.icon && <span>{p.item.icon({})}</span>}
    </button>
  );
}

function GridSuggEmpty(p: GridSuggestionMenuEmptyProps) {
  return <div className={p.className} style={{ gridColumn: `span ${p.columns}`, padding: 12, textAlign: "center", color: "#666" }}>{p.children || "No results"}</div>;
}

function LinkBtn(p: LinkToolbarButtonProps) { return <ToolbarBtn {...p as any} />; }
function LinkRoot(p: LinkToolbarRootProps) { return <ToolbarRoot {...p as any} />; }
function LinkSel(p: LinkToolbarSelectProps) { return <ToolbarSel {...p as any} />; }
function FileBtn(p: FilePanelButtonProps) { return <button className={p.className} onClick={p.onClick} style={{ background: "transparent", border: "1px solid #333", borderRadius: 4, padding: "4px 8px", color: "#ccc", cursor: "pointer" }}>{p.children || p.label}</button>; }
function FileRoot(p: FilePanelRootProps) { return <div className={p.className} style={{ background: "#252525", border: "1px solid #333", borderRadius: 8, padding: 12 }}><div>{p.tabs?.map(t => <button key={t.name} onClick={() => p.setOpenTab(t.name)} style={{ background: p.openTab === t.name ? "#3b3b3b" : "transparent", border: "none", borderRadius: 4, padding: "4px 8px", color: "#ccc", cursor: "pointer" }}>{t.name}</button>)}</div><div>{p.tabs?.find(t => t.name === p.openTab)?.tabPanel}</div></div>; }
function FileFileInput(p: FilePanelFileInputProps) { return <input type="file" accept={p.accept} className={p.className} placeholder={p.placeholder} onChange={e => p.onChange(e.target.files?.[0] || null)} style={{ border: "1px solid #333", borderRadius: 4, padding: 4, color: "#ccc", background: "#1e1e1e" }} />; }
function FileTabPanel(p: FilePanelTabPanelProps) { return <div className={p.className} style={{ marginTop: 8 }}>{p.children}</div>; }
function FileTextInput(p: FilePanelTextInputProps) { return <input type="text" className={p.className} value={p.value} placeholder={p.placeholder} onChange={p.onChange} onKeyDown={p.onKeyDown as any} style={{ border: "1px solid #333", borderRadius: 4, padding: "4px 8px", color: "#ccc", background: "#1e1e1e", width: "100%" }} />; }
function TableRoot(p: TableHandleRootProps) { return <div className={p.className} draggable={p.draggable} onDragStart={p.onDragStart} onDragEnd={p.onDragEnd} style={p.style}>{p.children}</div>; }
function TableExtend(p: TableHandleExtendButtonProps) { return <button className={p.className} onClick={p.onClick} onMouseDown={p.onMouseDown} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#888" }}>{p.children}</button>; }

function CCard(p: CommentCardProps) { return <div className={p.className} tabIndex={p.tabIndex} onFocus={p.onFocus as any} onBlur={p.onBlur as any} style={{ background: "#252525", border: "1px solid #333", borderRadius: 8, padding: 8 }}>{p.children}</div>; }
function CSection(p: CommentCardSectionProps) { return <div className={p.className} style={{ padding: "4px 0" }}>{p.children}</div>; }
function CExpand(p: CommentExpandSectionProps) { return <div className={p.className}>{p.children}</div>; }
function CEditor(p: CommentEditorProps) { return <div className={p.className}>{p.children}</div>; }
function CComment(p: CommentCommentProps) { return <div className={p.className} style={{ padding: 4 }}>{p.children}</div>; }

function GBadgeRoot(p: BadgeRootProps) { return <span className={p.className} onClick={p.onClick as any} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: p.isSelected ? "#3b3b3b" : "#1e1e1e", border: "1px solid #333", borderRadius: 4, padding: "2px 6px", color: "#ccc", cursor: p.onClick ? "pointer" : "default" }}>{p.icon}{p.text}</span>; }
function GBadgeGroup(p: BadgeGroupProps) { return <div className={p.className} style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{p.children}</div>; }
function GFormRoot(p: FormRootProps) { return <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{p.children}</div>; }
function GFormInput(p: FormTextInputProps) { return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{p.label && <label style={{ fontSize: 12, color: "#888" }}>{p.label}</label>}<input ref={p.ref} type="text" autoFocus={p.autoFocus} disabled={p.disabled} placeholder={p.placeholder} value={p.value} onChange={p.onChange} onKeyDown={p.onKeyDown as any} style={{ border: "1px solid #333", borderRadius: 4, padding: "6px 10px", color: "#ccc", background: "#1e1e1e" }} /></div>; }
function GMenuRoot(p: MenuRootProps) { return <div style={{ position: "relative" }}>{p.children}</div>; }
function GMenuDivider(p: MenuDividerProps) { return <hr className={p.className} style={{ border: "none", borderTop: "1px solid #333", margin: "4px 0" }} />; }
function GMenuDropdown(p: MenuDropdownProps) { return <div className={p.className} style={{ background: "#252525", border: "1px solid #333", borderRadius: 8, padding: 4, minWidth: 160, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>{p.children}</div>; }
function GMenuItem(p: MenuItemProps) { return <button className={p.className} onClick={p.onClick} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 10px", border: "none", borderRadius: 4, background: "transparent", color: "#ddd", cursor: "pointer", fontSize: 14, textAlign: "left" }}>{p.icon && <span style={{ width: 16 }}>{p.icon}</span>}{p.checked && <span>✓</span>}{p.children}</button>; }
function GMenuLabel(p: MenuLabelProps) { return <div className={p.className} style={{ padding: "4px 10px", fontSize: 11, color: "#888", textTransform: "uppercase" }}>{p.children}</div>; }
function GMenuTrigger(p: MenuTriggerProps) { return <div>{p.children}</div>; }
function GMenuBtn(p: MenuButtonProps) { return <SideBtn {...p as any} />; }
function GPopoverRoot(p: PopoverRootProps) { return <div>{p.children}</div>; }
function GPopoverContent(p: PopoverContentProps) { return <div className={p.className} style={{ background: "#252525", border: "1px solid #333", borderRadius: 8, padding: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>{p.children}</div>; }
function GPopoverTrigger(p: PopoverTriggerProps) { return <div>{p.children}</div>; }
function GToolbarRoot(p: ToolbarRootProps) { return <ToolbarRoot {...p as any} />; }
function GToolbarBtn(p: ToolbarButtonProps) { return <ToolbarBtn {...p as any} />; }
function GToolbarSel(p: ToolbarSelectProps) { return <ToolbarSel {...p as any} />; }

const defaultComponents = {
  FormattingToolbar: { Root: ToolbarRoot, Button: ToolbarBtn, Select: ToolbarSel },
  FilePanel: { Root: FileRoot, Button: FileBtn, FileInput: FileFileInput, TabPanel: FileTabPanel, TextInput: FileTextInput },
  LinkToolbar: { Root: LinkRoot, Button: LinkBtn, Select: LinkSel },
  SideMenu: { Root: SideRoot, Button: SideBtn },
  SuggestionMenu: { Root: SuggRoot, Item: SuggItem, Label: SuggLabel, Loader: SuggLoader, EmptyItem: SuggEmpty },
  GridSuggestionMenu: { Root: GridSuggRoot, Item: GridSuggItem, EmptyItem: GridSuggEmpty },
  TableHandle: { Root: TableRoot, ExtendButton: TableExtend },
  Comments: { Card: CCard, CardSection: CSection, ExpandSectionsPrompt: CExpand, Editor: CEditor, Comment: CComment },
  Generic: {
    Badge: { Root: GBadgeRoot, Group: GBadgeGroup },
    Form: { Root: GFormRoot, TextInput: GFormInput },
    Menu: { Root: GMenuRoot, Divider: GMenuDivider, Dropdown: GMenuDropdown, Item: GMenuItem, Label: GMenuLabel, Trigger: GMenuTrigger, Button: GMenuBtn },
    Popover: { Root: GPopoverRoot, Content: GPopoverContent, Trigger: GPopoverTrigger },
    Toolbar: { Root: GToolbarRoot, Button: GToolbarBtn, Select: GToolbarSel },
  },
};

export function BlockNoteUIProvider({ children }: { children: ReactNode }) {
  return <ComponentsContext.Provider value={defaultComponents as any}>{children}</ComponentsContext.Provider>;
}
