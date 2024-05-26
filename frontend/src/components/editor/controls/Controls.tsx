/* Copyright 2024 Marimo. All rights reserved. */
import {
  LayoutTemplateIcon,
  SaveIcon,
  EditIcon,
  PlayIcon,
  SquareIcon,
  Undo2Icon,
} from "lucide-react";

import { cn } from "@/utils/cn";
import { Button } from "@/components/editor/inputs/Inputs";
import { KeyboardShortcuts } from "@/components/editor/controls/keyboard-shortcuts";
import { ShutdownButton } from "@/components/editor/controls/shutdown-button";
import { RecoveryButton } from "@/components/editor/RecoveryButton";

import { Tooltip } from "../../ui/tooltip";
import { renderShortcut } from "../../shortcuts/renderShortcut";
import { useCellActions } from "../../../core/cells/cells";
import { ConfigButton } from "../../app-config/app-config-button";
import { LayoutSelect } from "../renderers/layout-select";
import { NotebookMenuDropdown } from "@/components/editor/controls/notebook-menu-dropdown";
import { FindReplace } from "@/components/find-replace/find-replace";
import { AppConfig } from "@/core/config/config-schema";
import { useShouldShowInterrupt } from "../cell/useShouldShowInterrupt";
import { CommandPaletteButton } from "./command-palette-button";

interface ControlsProps {
  filename: string | null;
  needsSave: boolean;
  onSaveNotebook: () => void;
  getCellsAsJSON: () => string;
  presenting: boolean;
  onTogglePresenting: () => void;
  onInterrupt: () => void;
  onRun: () => void;
  closed: boolean;
  running: boolean;
  needsRun: boolean;
  undoAvailable: boolean;
  appWidth: AppConfig["width"];
}

export const Controls = ({
  filename,
  needsSave,
  onSaveNotebook,
  getCellsAsJSON,
  presenting,
  onTogglePresenting,
  onInterrupt,
  onRun,
  closed,
  running,
  needsRun,
  undoAvailable,
  appWidth,
}: ControlsProps): JSX.Element => {
  const { undoDeleteCell } = useCellActions();

  const handleSaveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSaveNotebook();
  };

  let undoControl: JSX.Element | null = null;
  if (!closed && undoAvailable) {
    undoControl = (
      <Tooltip content="Undo cell deletion">
        <Button
          data-testid="undo-delete-cell"
          size="medium"
          color="hint-green"
          shape="circle"
          onClick={undoDeleteCell}
        >
          <Undo2Icon size={16} strokeWidth={1.5} />
        </Button>
      </Tooltip>
    );
  }

  return (
    <>
      {!presenting && <FindReplace />}

      {!closed && (
        <div className={topRightControls}>
          {presenting && <LayoutSelect />}
          <NotebookMenuDropdown />
          <ConfigButton />
          <ShutdownButton description="This will terminate the Python kernel. You'll lose all data that's in memory." />
        </div>
      )}

      <div
        className={cn(
          bottomLeftControls,
          appWidth === "normal" && "xl:flex-row",
        )}
      >
        {closed ? (
          <RecoveryButton
            filename={filename}
            getCellsAsJSON={getCellsAsJSON}
            needsSave={needsSave}
          />
        ) : (
          <Tooltip content={renderShortcut("global.save")}>
            <Button
              data-testid="save-button"
              id="save-button"
              shape="rectangle"
              color={needsSave ? "yellow" : "hint-green"}
              onClick={handleSaveClick}
            >
              <SaveIcon strokeWidth={1.5} />
            </Button>
          </Tooltip>
        )}

        <Tooltip content={renderShortcut("global.hideCode")}>
          <Button
            data-testid="hide-code-button"
            id="preview-button"
            shape="rectangle"
            color="white"
            onClick={onTogglePresenting}
          >
            {presenting ? (
              <EditIcon strokeWidth={1.5} />
            ) : (
              <LayoutTemplateIcon strokeWidth={1.5} />
            )}
          </Button>
        </Tooltip>

        <CommandPaletteButton />
        <KeyboardShortcuts />
      </div>

      <div className={bottomRightControls}>
        {undoControl}
        {!closed && (
          <RunControlButton
            running={running}
            needsRun={needsRun}
            onRun={onRun}
            onInterrupt={onInterrupt}
          />
        )}
      </div>
    </>
  );
};

const RunControlButton = ({
  running,
  needsRun,
  onRun,
  onInterrupt,
}: {
  running: boolean;
  needsRun: boolean;
  onRun: () => void;
  onInterrupt: () => void;
}) => {
  // Show the interrupt button after 200ms to avoid flickering.
  const showInterrupt = useShouldShowInterrupt(running);

  if (showInterrupt) {
    return (
      <Tooltip content={renderShortcut("global.interrupt")}>
        <Button
          data-testid="interrupt-button"
          size="medium"
          color="yellow"
          shape="circle"
          onClick={onInterrupt}
        >
          <SquareIcon strokeWidth={1.5} size={16} />
        </Button>
      </Tooltip>
    );
  } else if (needsRun) {
    return (
      <Tooltip content={renderShortcut("global.runStale")}>
        <Button
          data-testid="run-button"
          size="medium"
          color="yellow"
          shape="circle"
          onClick={onRun}
        >
          <PlayIcon strokeWidth={1.5} size={16} />
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip content="Nothing to run">
      <Button
        data-testid="run-button"
        className={"inactive-button"}
        color="disabled"
        size="medium"
        shape="circle"
      >
        <PlayIcon strokeWidth={1.5} size={16} />
      </Button>
    </Tooltip>
  );
};

const topRightControls =
  "absolute top-3 right-5 m-0 flex items-center space-x-3 min-h-[28px] no-print pointer-events-auto z-30";

const bottomRightControls =
  "absolute bottom-5 right-5 flex items-center space-x-3 no-print pointer-events-auto z-30";

const bottomLeftControls =
  "absolute bottom-5 left-3 m-0 flex flex-col-reverse gap-2 items-center no-print pointer-events-auto z-50";
