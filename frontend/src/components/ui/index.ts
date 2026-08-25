// Shared application primitives. Import from "~/components/ui".
//
// These are the only surfaces, controls and states the signed-in application
// uses. They resolve entirely from the role tokens in global.css, so a theme
// changes their colour and nothing else.

export { Button } from "./button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./button";
export { IconButton } from "./icon-button";
export type { IconButtonProps } from "./icon-button";
export { CopyButton } from "./copy-button";

export {
  Page,
  PageHeader,
  Section,
  Surface,
  SurfaceHeader,
  PreviewPane,
  Divider,
} from "./surface";
export type {
  PageProps,
  PageHeaderProps,
  SectionProps,
  SurfaceProps,
  PreviewPaneProps,
} from "./surface";

export {
  Field,
  fieldIds,
  Fieldset,
  Input,
  Textarea,
  Select,
  CodeInput,
} from "./field";
export type { FieldProps } from "./field";
export { Switch } from "./switch";
export type { SwitchProps } from "./switch";

export { Dialog, ConfirmDialog, Sheet } from "./dialog";
export type { DialogProps, ConfirmDialogProps, SheetProps } from "./dialog";
export {
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  MenuLabel,
} from "./dropdown-menu";

export {
  SearchField,
  CollectionToolbar,
  SelectionBar,
  SaveIndicator,
} from "./collection";
export type { SaveState, SelectionBarProps } from "./collection";

export {
  Table,
  Thead,
  Tbody,
  Th,
  SortHeader,
  Tr,
  Td,
  TdMeta,
  Checkbox,
} from "./table";
export { SegmentedControl } from "./segmented-control";
export type { SegmentedOption } from "./segmented-control";
export { LocalNav } from "./local-nav";
export type { LocalNavItem } from "./local-nav";

export { Badge } from "./badge";
export type { BadgeTone } from "./badge";
export { Callout } from "./callout";
export type { CalloutTone } from "./callout";
export { EmptyState } from "./empty-state";
export { ProgressBar } from "./progress-bar";
export { SummaryList, Meter, DefinitionRow } from "./summary";
export type { SummaryItem } from "./summary";
export { Toaster } from "./toaster";
export { ThemeToggle, ThemeSwatch } from "./theme-toggle";

export { IconSelector } from "./icon-selector";
export type { IconSelectorProps } from "./icon-selector";
