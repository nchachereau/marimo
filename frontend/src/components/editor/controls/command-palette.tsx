/* Copyright 2024 Marimo. All rights reserved. */
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useRegisteredActions } from "../../../core/hotkeys/actions";
import { useRecentCommands } from "../../../hooks/useRecentCommands";
import { KeyboardHotkeys } from "../../shortcuts/renderShortcut";
import { type HotkeyAction, isHotkeyAction } from "@/core/hotkeys/hotkeys";
import { atom, useAtom, useAtomValue } from "jotai";
import { useNotebookActions } from "../actions/useNotebookActions";
import { Objects } from "@/utils/objects";
import { parseShortcut } from "@/core/hotkeys/shortcuts";
import { isParentAction, flattenActions } from "../actions/types";
import { useCellActionButtons } from "../actions/useCellActionButton";
import { lastFocusedCellAtom } from "@/core/cells/focus";
import { useConfigActions } from "../actions/useConfigActions";
import { hotkeysAtom } from "@/core/config/config";
import { useEventListener } from "@/hooks/useEventListener";

export const commandPaletteAtom = atom(false);

export const CommandPalette = () => {
  const [open, setOpen] = useAtom(commandPaletteAtom);
  const registeredActions = useRegisteredActions();
  const lastFocusedCell = useAtomValue(lastFocusedCellAtom);
  const hotkeys = useAtomValue(hotkeysAtom);
  // Cell actions
  let cellActions = useCellActionButtons({ cell: lastFocusedCell }).flat();
  cellActions = flattenActions(cellActions);
  // Notebook actions
  const configActions = useConfigActions();
  let notebookActions = useNotebookActions();
  notebookActions = [
    ...flattenActions(notebookActions),
    ...flattenActions(configActions),
  ];

  const notebookActionsWithoutHotkeys = notebookActions.filter(
    (action) => !action.hotkey,
  );
  const keyedNotebookActions = Objects.keyBy(
    notebookActionsWithoutHotkeys,
    (action) => action.label,
  );

  const { recentCommands, addRecentCommand } = useRecentCommands();
  const recentCommandsSet = new Set(recentCommands);

  useEventListener(document, "keydown", (e) => {
    if (parseShortcut(hotkeys.getHotkey("global.commandPalette").key)(e)) {
      e.preventDefault();
      setOpen((open) => !open);
    }
  });

  const renderShortcutCommandItem = (shortcut: HotkeyAction) => {
    const action = registeredActions[shortcut];
    if (!action) {
      return null;
    }
    const hotkey = hotkeys.getHotkey(shortcut);

    return (
      <CommandItem
        onSelect={() => {
          addRecentCommand(shortcut);
          // Close first and then run the action, so the dialog doesn't steal focus
          setOpen(false);
          requestAnimationFrame(() => {
            action();
          });
        }}
        key={shortcut}
        value={hotkey.name}
      >
        <span>{hotkey.name}</span>
        <CommandShortcut>
          <KeyboardHotkeys shortcut={hotkey.key} />
        </CommandShortcut>
      </CommandItem>
    );
  };

  const renderCommandItem = (
    label: string,
    handle: () => void,
    hotkey?: HotkeyAction,
  ) => {
    return (
      <CommandItem
        onSelect={() => {
          addRecentCommand(label);
          setOpen(false);
          requestAnimationFrame(() => {
            handle();
          });
        }}
        key={label}
        value={label}
      >
        <span>{label}</span>
        {hotkey && (
          <CommandShortcut>
            <KeyboardHotkeys shortcut={hotkeys.getHotkey(hotkey).key} />
          </CommandShortcut>
        )}
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type to search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {recentCommands.length > 0 && (
          <>
            <CommandGroup heading="Recently Used">
              {recentCommands.map((shortcut) => {
                // Hotkey
                if (isHotkeyAction(shortcut)) {
                  return renderShortcutCommandItem(shortcut);
                }
                // Other action
                const action = keyedNotebookActions[shortcut];
                if (action && !isParentAction(action)) {
                  return renderCommandItem(
                    action.label,
                    action.handleHeadless || action.handle,
                  );
                }
                return null;
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Commands">
          {hotkeys.iterate().map((shortcut) => {
            if (recentCommandsSet.has(shortcut)) {
              return null; // Don't show recent commands in the main list
            }
            return renderShortcutCommandItem(shortcut);
          })}
          {notebookActionsWithoutHotkeys.map((action) => {
            if (recentCommandsSet.has(action.label)) {
              return null; // Don't show recent commands in the main list
            }
            return renderCommandItem(
              action.label,
              action.handleHeadless || action.handle,
            );
          })}
          {cellActions.map((action) => {
            if (recentCommandsSet.has(action.label)) {
              return null; // Don't show recent commands in the main list
            }
            return renderCommandItem(
              `Cell > ${action.label}`,
              action.handleHeadless || action.handle,
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
