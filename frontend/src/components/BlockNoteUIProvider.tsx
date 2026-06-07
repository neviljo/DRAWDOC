import { type ReactNode } from "react";
import { ComponentsContext } from "@blocknote/react";

function ToolbarRoot({ className, children, onMouseEnter, onMouseLeave }: any) {
  return (
    <div
      className={"flex items-center gap-1 p-1 bg-surface-900 rounded-lg border border-surface-700 " + (className || "")}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}

function ToolbarBtn({ className, mainTooltip, isSelected, isDisabled, onClick, icon, children }: any) {
  return (
    <button
      title={mainTooltip}
      disabled={isDisabled}
      onClick={onClick}
      className={
        "inline-flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-colors " +
        (isSelected ? "bg-surface-700 text-surface-200" : "text-surface-400 hover:text-surface-200 hover:bg-surface-800") +
        " " + (className || "")
      }
      style={{ opacity: isDisabled ? 0.35 : 1, cursor: isDisabled ? "not-allowed" : "pointer" }}
    >
      {icon}{children}
    </button>
  );
}

function ToolbarSel({ className, items, isDisabled }: any) {
  return (
    <select
      className={"bg-surface-800 border border-surface-700 rounded px-1.5 py-1 text-xs text-surface-300 " + (className || "")}
      disabled={isDisabled}
      onChange={(e: any) => items?.[+e.target.value]?.onClick()}
    >
      {items?.map((item: any, i: number) => (
        <option key={i} value={i} selected={item.isSelected}>{item.text}</option>
      ))}
    </select>
  );
}

function SideRoot({ className, children, ...rest }: any) {
  return <div className={className || ""} {...rest}>{children}</div>;
}

function SideBtn({ className, onClick, icon, children, draggable, onDragStart, onDragEnd }: any) {
  return (
    <button
      className={"flex items-center justify-center w-6 h-6 rounded hover:bg-surface-800 text-surface-500 hover:text-surface-300 cursor-grab active:cursor-grabbing " + (className || "")}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {icon}{children}
    </button>
  );
}

function SuggRoot({ id, className, children }: any) {
  return (
    <div
      id={id}
      className={"bg-surface-900 border border-surface-700 rounded-lg p-1 min-w-[180px] shadow-xl " + (className || "")}
    >
      {children}
    </div>
  );
}

function SuggItem({ id, className, isSelected, onClick, item }: any) {
  return (
    <button
      id={id}
      className={
        "flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-sm text-left transition-colors " +
        (isSelected ? "bg-surface-700 text-surface-200" : "text-surface-400 hover:bg-surface-800 hover:text-surface-200") +
        " " + (className || "")
      }
      onClick={onClick}
      type="button"
    >
      {item?.icon && <span className="text-base shrink-0">{typeof item.icon === "function" ? item.icon({}) : item.icon}</span>}
      <span>{item?.text || item?.title || ""}</span>
    </button>
  );
}

function SuggLabel({ className, children }: any) {
  return <div className={"px-2.5 py-1 text-[10px] font-semibold text-surface-500 uppercase tracking-wider " + (className || "")}>{children}</div>;
}

function SuggLoader({ className }: any) {
  return <div className={"p-3 text-center text-xs text-surface-500 " + (className || "")}>Loading...</div>;
}

function SuggEmpty({ className, children }: any) {
  return <div className={"p-3 text-center text-xs text-surface-500 " + (className || "")}>{children || "No results"}</div>;
}

function GridSuggRoot({ id, columns, className, children }: any) {
  return (
    <div
      id={id}
      className={"bg-surface-900 border border-surface-700 rounded-lg p-1 shadow-xl " + (className || "")}
      style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, minWidth: 280 }}
    >
      {children}
    </div>
  );
}

function GridSuggItem({ id, className, isSelected, onClick, item }: any) {
  return (
    <button
      id={id}
      className={
        "flex items-center justify-center p-2 rounded text-lg transition-colors " +
        (isSelected ? "bg-surface-700" : "hover:bg-surface-800") +
        " " + (className || "")
      }
      onClick={onClick}
      type="button"
    >
      {item?.icon && <span>{typeof item.icon === "function" ? item.icon({}) : item.icon}</span>}
    </button>
  );
}

function GridSuggEmpty({ columns, className, children }: any) {
  return <div className={"p-3 text-center text-xs text-surface-500 " + (className || "")} style={{ gridColumn: `span ${columns}` }}>{children || "No results"}</div>;
}

function LinkBtn(p: any) { return <ToolbarBtn {...p} />; }
function LinkRoot(p: any) { return <ToolbarRoot {...p} />; }
function LinkSel(p: any) { return <ToolbarSel {...p} />; }

function FileBtn({ className, onClick, children, label }: any) {
  return <button className={"px-2 py-1 rounded text-xs text-surface-400 hover:text-surface-200 hover:bg-surface-800 border border-surface-700 " + (className || "")} onClick={onClick} type="button">{children || label}</button>;
}

function FileRoot({ className, tabs, openTab, setOpenTab, loading }: any) {
  return (
    <div className={"bg-surface-900 border border-surface-700 rounded-lg p-3 " + (className || "")}>
      <div className="flex gap-1 mb-3">
        {tabs?.map((t: any) => (
          <button key={t.name} onClick={() => setOpenTab(t.name)} className={"px-2 py-1 rounded text-xs " + (openTab === t.name ? "bg-surface-700 text-surface-200" : "text-surface-400 hover:text-surface-200")} type="button">
            {t.name}
          </button>
        ))}
      </div>
      <div className="text-xs text-surface-400">
        {loading ? "Loading..." : tabs?.find((t: any) => t.name === openTab)?.tabPanel}
      </div>
    </div>
  );
}

function FileFileInput({ className, accept, placeholder, onChange }: any) {
  return <input type="file" accept={accept} className={"w-full px-2 py-1 rounded text-xs bg-surface-800 border border-surface-700 text-surface-300 file:mr-2 file:rounded file:border-0 file:bg-surface-700 file:text-surface-300 file:text-xs file:px-2 file:py-1 " + (className || "")} placeholder={placeholder} onChange={(e: any) => onChange(e.target.files?.[0] || null)} />;
}

function FileTabPanel({ className, children }: any) {
  return <div className={"mt-2 " + (className || "")}>{children}</div>;
}

function FileTextInput({ className, value, placeholder, onChange, onKeyDown }: any) {
  return <input type="text" className={"w-full px-2 py-1.5 rounded text-xs bg-surface-800 border border-surface-700 text-surface-300 placeholder-surface-500 " + (className || "")} value={value} placeholder={placeholder} onChange={onChange} onKeyDown={onKeyDown} />;
}

function TableRoot({ className, draggable, onDragStart, onDragEnd, style, children }: any) {
  return <div className={className || ""} draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd} style={style}>{children}</div>;
}

function TableExtend({ className, onClick, onMouseDown, children }: any) {
  return <button className={"text-surface-500 hover:text-surface-300 " + (className || "")} onClick={onClick} onMouseDown={onMouseDown} type="button">{children}</button>;
}

function CCard({ className, tabIndex, onFocus, onBlur, children }: any) {
  return <div className={"bg-surface-900 border border-surface-700 rounded-lg p-2 " + (className || "")} tabIndex={tabIndex} onFocus={onFocus} onBlur={onBlur}>{children}</div>;
}
function CSection({ className, children }: any) { return <div className={"py-1 " + (className || "")}>{children}</div>; }
function CExpand({ className, children }: any) { return <div className={className || ""}>{children}</div>; }
function CEditor({ className, children }: any) { return <div className={className || ""}>{children}</div>; }
function CComment({ className, children }: any) { return <div className={"py-1 " + (className || "")}>{children}</div>; }

function GBadgeRoot({ className, text, icon, isSelected, onClick }: any) {
  return <span className={"inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs " + (isSelected ? "bg-surface-700 text-surface-200" : "bg-surface-800 text-surface-400") + " " + (className || "")} onClick={onClick}>{icon}{text}</span>;
}
function GBadgeGroup({ className, children }: any) { return <div className={"flex gap-1 flex-wrap " + (className || "")}>{children}</div>; }
function GFormRoot({ children }: any) { return <div className="flex flex-col gap-2">{children}</div>; }
function GFormInput({ label, autoFocus, disabled, placeholder, value, onChange, onKeyDown, ref }: any) {
  return <div className="flex flex-col gap-1">{label && <label className="text-[10px] text-surface-500 font-medium">{label}</label>}<input ref={ref} type="text" autoFocus={autoFocus} disabled={disabled} placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} className="w-full px-2 py-1.5 rounded text-xs bg-surface-800 border border-surface-700 text-surface-300 placeholder-surface-500" /></div>;
}
function GMenuRoot({ children }: any) { return <div className="relative">{children}</div>; }
function GMenuDivider({ className }: any) { return <hr className={"border-surface-700 my-1 " + (className || "")} />; }
function GMenuDropdown({ className, children }: any) { return <div className={"bg-surface-900 border border-surface-700 rounded-lg p-1 min-w-[160px] shadow-xl " + (className || "")}>{children}</div>; }
function GMenuItem({ className, icon, checked, onClick, children }: any) {
  return <button className={"flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-sm text-left text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-colors " + (className || "")} onClick={onClick} type="button">{icon && <span className="w-4 shrink-0">{icon}</span>}{checked && <span className="text-accent text-xs">✓</span>}{children}</button>;
}
function GMenuLabel({ className, children }: any) { return <div className={"px-2.5 py-1 text-[10px] font-semibold text-surface-500 uppercase tracking-wider " + (className || "")}>{children}</div>; }
function GMenuTrigger({ children }: any) { return <div>{children}</div>; }
function GMenuBtn(p: any) { return <SideBtn {...p} />; }
function GPopoverRoot({ children }: any) { return <div>{children}</div>; }
function GPopoverContent({ className, children }: any) { return <div className={"bg-surface-900 border border-surface-700 rounded-lg p-2 shadow-xl " + (className || "")}>{children}</div>; }
function GPopoverTrigger({ children }: any) { return <div>{children}</div>; }
function GToolbarRoot(p: any) { return <ToolbarRoot {...p} />; }
function GToolbarBtn(p: any) { return <ToolbarBtn {...p} />; }
function GToolbarSel(p: any) { return <ToolbarSel {...p} />; }

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
