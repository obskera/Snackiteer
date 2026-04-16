import { useCallback, useMemo, useState } from "react";
import {
    buildRoomTemplate,
    validateRoomTemplate,
    DEFAULT_TILE_LEGEND,
    DEFAULT_ENTITY_LEGEND,
    buildTileLookup,
    buildEntityLookup,
    roomTemplateToTileMapPayload,
    roomTemplateToWorldgenInput,
    createRoomTemplateRegistry,
} from "@/logic/tileMatrix";
import type { RoomTemplate, TileMatrixValidationResult } from "@/logic/tileMatrix";
import {
    exportBrowserJsonFile,
    readBrowserJsonFileText,
} from "@/services/browserJsonFile";
import "./TileMatrixEditorTool.css";

export type TileMatrixEditorToolProps = {
    title?: string;
};

const STARTER_TILE_TEXT = `tl te te te tr
le .  .  .  re
le .  ch .  re
le .  .  .  re
bl be be be br`;

const STARTER_OVERLAY_TEXT = `.  .  .  .  .
.  E  .  .  .
.  .  .  .  .
.  .  .  I  .
.  P  .  .  .`;

type ExportFormat = "room-template" | "tilemap-payload" | "worldgen-input";

const TileMatrixEditorTool = ({
    title = "Tile matrix editor",
}: TileMatrixEditorToolProps) => {
    // --- Template metadata ---
    const [templateId, setTemplateId] = useState("my-room");
    const [templateName, setTemplateName] = useState("My Room");
    const [templateDesc, setTemplateDesc] = useState("");
    const [templateTags, setTemplateTags] = useState("");

    // --- Matrix text ---
    const [tileText, setTileText] = useState(STARTER_TILE_TEXT);
    const [overlayText, setOverlayText] = useState(STARTER_OVERLAY_TEXT);

    // --- Export/import ---
    const [exportFormat, setExportFormat] = useState<ExportFormat>("room-template");
    const [jsonOutput, setJsonOutput] = useState("");
    const [jsonImportText, setJsonImportText] = useState("");

    // --- Status ---
    const [status, setStatus] = useState("Ready.");
    const [statusType, setStatusType] = useState<"ok" | "error" | "info">("info");

    // --- Registry ---
    const [registry] = useState(() => createRoomTemplateRegistry());
    const [registryList, setRegistryList] = useState<RoomTemplate[]>([]);

    // --- Legend lookups ---
    const tileLookup = useMemo(() => buildTileLookup(DEFAULT_TILE_LEGEND), []);
    const entityLookup = useMemo(
        () => buildEntityLookup(DEFAULT_ENTITY_LEGEND),
        [],
    );

    // --- Build + validate on every change ---
    const buildResult = useMemo(() => {
        return buildRoomTemplate({
            id: templateId,
            name: templateName,
            description: templateDesc || undefined,
            tileText,
            overlayText: overlayText.trim() ? overlayText : undefined,
            tags: templateTags
                ? templateTags.split(",").map((t) => t.trim()).filter(Boolean)
                : undefined,
        });
    }, [templateId, templateName, templateDesc, tileText, overlayText, templateTags]);

    const { template, validation } = buildResult;

    // --- Cell category for CSS class ---
    const cellClass = useCallback(
        (code: string): string => {
            const entry = tileLookup.get(code);
            const cat = entry?.category ?? "unknown";
            return `TileMatrixEditor__cell TileMatrixEditor__cell--${cat}`;
        },
        [tileLookup],
    );

    // --- Export ---
    const handleExport = useCallback(() => {
        if (!validation.ok) {
            setStatus("Cannot export: fix validation errors first.");
            setStatusType("error");
            return;
        }

        let json: string;
        switch (exportFormat) {
            case "room-template":
                json = JSON.stringify(template, null, 2);
                break;
            case "tilemap-payload":
                json = JSON.stringify(
                    roomTemplateToTileMapPayload(template),
                    null,
                    2,
                );
                break;
            case "worldgen-input":
                json = JSON.stringify(
                    roomTemplateToWorldgenInput(template),
                    null,
                    2,
                );
                break;
        }

        setJsonOutput(json);
        setStatus(`Exported as ${exportFormat} (${json.length} bytes).`);
        setStatusType("ok");
    }, [template, validation, exportFormat]);

    const handleExportFile = useCallback(() => {
        if (!jsonOutput) {
            setStatus("Export to text area first.");
            setStatusType("error");
            return;
        }
        exportBrowserJsonFile(jsonOutput, `${templateId}-${exportFormat}.json`);
        setStatus("File download started.");
        setStatusType("ok");
    }, [jsonOutput, templateId, exportFormat]);

    // --- Import ---
    const handleImportJson = useCallback(() => {
        const raw = jsonImportText.trim();
        if (!raw) {
            setStatus("Paste JSON into the import area first.");
            setStatusType("error");
            return;
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            setStatus("Import failed: invalid JSON.");
            setStatusType("error");
            return;
        }

        const candidate = parsed as RoomTemplate;
        if (candidate.version === "um-room-template-v1" && candidate.tileMatrix) {
            const result = validateRoomTemplate(candidate);
            if (!result.ok) {
                setStatus(`Import validation failed: ${result.errors.join("; ")}`);
                setStatusType("error");
                return;
            }
            setTemplateId(candidate.id);
            setTemplateName(candidate.name);
            setTemplateDesc(candidate.description ?? "");
            setTemplateTags(candidate.tags?.join(", ") ?? "");
            setTileText(
                candidate.tileMatrix.map((row) => row.join(" ")).join("\n"),
            );
            if (candidate.overlayMatrix) {
                setOverlayText(
                    candidate.overlayMatrix.map((row) => row.join(" ")).join("\n"),
                );
            }
            setStatus("Imported room template.");
            setStatusType("ok");
        } else {
            setStatus(
                'Import failed: expected a RoomTemplate with version "um-room-template-v1".',
            );
            setStatusType("error");
        }
    }, [jsonImportText]);

    const handleImportFile = useCallback(async () => {
        try {
            const text = await readBrowserJsonFileText();
            if (text != null) {
                setJsonImportText(text);
                setStatus("File loaded into import area. Click Import JSON to apply.");
                setStatusType("info");
            }
        } catch {
            setStatus("File read failed.");
            setStatusType("error");
        }
    }, []);

    // --- Registry ---
    const handleSaveToRegistry = useCallback(() => {
        if (!validation.ok) {
            setStatus("Fix validation errors before saving.");
            setStatusType("error");
            return;
        }
        if (registry.has(template.id)) {
            registry.remove(template.id);
        }
        const result = registry.register(template);
        if (!result.ok) {
            setStatus(`Registry error: ${result.errors.join("; ")}`);
            setStatusType("error");
            return;
        }
        setRegistryList(registry.list());
        setStatus(`Saved "${template.id}" to registry.`);
        setStatusType("ok");
    }, [template, validation, registry]);

    const handleLoadFromRegistry = useCallback(
        (id: string) => {
            const t = registry.get(id);
            if (!t) return;
            setTemplateId(t.id);
            setTemplateName(t.name);
            setTemplateDesc(t.description ?? "");
            setTemplateTags(t.tags?.join(", ") ?? "");
            setTileText(t.tileMatrix.map((row) => row.join(" ")).join("\n"));
            if (t.overlayMatrix) {
                setOverlayText(
                    t.overlayMatrix.map((row) => row.join(" ")).join("\n"),
                );
            } else {
                setOverlayText("");
            }
            setStatus(`Loaded "${id}" from registry.`);
            setStatusType("ok");
        },
        [registry],
    );

    const handleExportRegistry = useCallback(() => {
        const json = registry.exportAll({ pretty: true });
        setJsonOutput(json);
        setStatus(`Exported registry (${registry.list().length} templates).`);
        setStatusType("ok");
    }, [registry]);

    const handleImportRegistry = useCallback(() => {
        const raw = jsonImportText.trim();
        if (!raw) {
            setStatus("Paste registry JSON into the import area first.");
            setStatusType("error");
            return;
        }
        const result = registry.importAll(raw);
        setRegistryList(registry.list());
        if (result.ok) {
            setStatus(`Imported ${registry.list().length} templates into registry.`);
            setStatusType("ok");
        } else {
            setStatus(`Registry import issues: ${result.errors.join("; ")}`);
            setStatusType("error");
        }
    }, [registry, jsonImportText]);

    // --- Render helpers ---
    const validationMessages = useMemo(() => {
        const msgs: string[] = [];
        if (validation.errors.length > 0) {
            msgs.push(...validation.errors.map((e) => `ERROR: ${e}`));
        }
        if (validation.warnings.length > 0) {
            msgs.push(...validation.warnings.map((w) => `WARN: ${w}`));
        }
        if (validation.ok) msgs.push("Valid.");
        return msgs;
    }, [validation]);

    return (
        <div className="TileMatrixEditor">
            <h3>{title}</h3>

            {/* --- Metadata --- */}
            <fieldset>
                <legend>Template metadata</legend>
                <div className="TileMatrixEditor__meta-row">
                    <label>
                        ID
                        <input
                            type="text"
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                        />
                    </label>
                    <label>
                        Name
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                        />
                    </label>
                    <label>
                        Tags (comma-separated)
                        <input
                            type="text"
                            value={templateTags}
                            onChange={(e) => setTemplateTags(e.target.value)}
                        />
                    </label>
                </div>
                <label>
                    Description
                    <input
                        type="text"
                        value={templateDesc}
                        onChange={(e) => setTemplateDesc(e.target.value)}
                        style={{ width: "100%" }}
                    />
                </label>
            </fieldset>

            {/* --- Tile matrix input --- */}
            <fieldset>
                <legend>
                    Tile matrix ({template.width}×{template.height})
                </legend>
                <textarea
                    rows={Math.max(3, template.height + 1)}
                    value={tileText}
                    onChange={(e) => setTileText(e.target.value)}
                    aria-label="Tile matrix text"
                    spellCheck={false}
                />
            </fieldset>

            {/* --- Overlay matrix input --- */}
            <fieldset>
                <legend>Overlay matrix (entities)</legend>
                <textarea
                    rows={Math.max(3, template.height + 1)}
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    aria-label="Overlay matrix text"
                    spellCheck={false}
                />
            </fieldset>

            {/* --- Live preview grid --- */}
            <fieldset>
                <legend>Preview</legend>
                {template.width > 0 && template.height > 0 ? (
                    <div
                        className="TileMatrixEditor__grid"
                        style={{
                            gridTemplateColumns: `repeat(${template.width}, 36px)`,
                        }}
                    >
                        {template.tileMatrix.flatMap((row, y) =>
                            row.map((code, x) => {
                                const overlayCode =
                                    template.overlayMatrix?.[y]?.[x];
                                const hasOverlay =
                                    overlayCode != null && overlayCode !== ".";
                                return (
                                    <div
                                        key={`${x}-${y}`}
                                        className={cellClass(code)}
                                        title={`(${x},${y}) tile=${code}${hasOverlay ? ` entity=${overlayCode}` : ""}`}
                                    >
                                        {code}
                                        {hasOverlay && (
                                            <span className="TileMatrixEditor__overlay-badge">
                                                {overlayCode}
                                            </span>
                                        )}
                                    </div>
                                );
                            }),
                        )}
                    </div>
                ) : (
                    <p>No grid to preview.</p>
                )}
            </fieldset>

            {/* --- Validation --- */}
            <fieldset>
                <legend>Validation</legend>
                <div
                    className={`TileMatrixEditor__status ${validation.ok ? "TileMatrixEditor__status--ok" : "TileMatrixEditor__status--error"}`}
                >
                    {validationMessages.join("\n")}
                </div>
            </fieldset>

            {/* --- Export --- */}
            <fieldset>
                <legend>Export</legend>
                <div className="TileMatrixEditor__actions">
                    <label>
                        Format
                        <select
                            value={exportFormat}
                            onChange={(e) =>
                                setExportFormat(e.target.value as ExportFormat)
                            }
                        >
                            <option value="room-template">
                                RoomTemplate (um-room-template-v1)
                            </option>
                            <option value="tilemap-payload">
                                TileMapPlacementPayload (um-tilemap-v1)
                            </option>
                            <option value="worldgen-input">Worldgen input</option>
                        </select>
                    </label>
                    <button type="button" onClick={handleExport}>
                        Export to text area
                    </button>
                    <button type="button" onClick={handleExportFile}>
                        Export JSON file
                    </button>
                </div>
                <textarea
                    className="TileMatrixEditor__json-area"
                    rows={8}
                    value={jsonOutput}
                    readOnly
                    aria-label="Export JSON output"
                />
            </fieldset>

            {/* --- Import --- */}
            <fieldset>
                <legend>Import</legend>
                <textarea
                    className="TileMatrixEditor__json-area"
                    rows={6}
                    value={jsonImportText}
                    onChange={(e) => setJsonImportText(e.target.value)}
                    placeholder="Paste RoomTemplate JSON here..."
                    aria-label="Import JSON input"
                />
                <div className="TileMatrixEditor__actions">
                    <button type="button" onClick={handleImportJson}>
                        Import JSON
                    </button>
                    <button type="button" onClick={handleImportFile}>
                        Import JSON file
                    </button>
                </div>
            </fieldset>

            {/* --- Registry (template library) --- */}
            <fieldset>
                <legend>
                    Template library ({registryList.length} templates)
                </legend>
                <div className="TileMatrixEditor__actions">
                    <button type="button" onClick={handleSaveToRegistry}>
                        Save current to library
                    </button>
                    <button type="button" onClick={handleExportRegistry}>
                        Export library
                    </button>
                    <button type="button" onClick={handleImportRegistry}>
                        Import library from import area
                    </button>
                </div>
                {registryList.length > 0 && (
                    <ul>
                        {registryList.map((t) => (
                            <li key={t.id}>
                                <button
                                    type="button"
                                    onClick={() => handleLoadFromRegistry(t.id)}
                                >
                                    Load
                                </button>{" "}
                                <strong>{t.id}</strong> — {t.name} ({t.width}×
                                {t.height})
                            </li>
                        ))}
                    </ul>
                )}
            </fieldset>

            {/* --- Tile legend reference --- */}
            <fieldset>
                <legend>Tile legend reference</legend>
                <details>
                    <summary>
                        {DEFAULT_TILE_LEGEND.entries.length} built-in tile codes
                    </summary>
                    <table className="TileMatrixEditor__legend-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>TileId</th>
                                <th>Label</th>
                                <th>Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEFAULT_TILE_LEGEND.entries.map((entry) => (
                                <tr key={entry.code}>
                                    <td>
                                        <code>{entry.code}</code>
                                    </td>
                                    <td>{entry.tileId}</td>
                                    <td>{entry.label}</td>
                                    <td>{entry.category ?? "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </details>
            </fieldset>

            {/* --- Entity legend reference --- */}
            <fieldset>
                <legend>Entity legend reference</legend>
                <details>
                    <summary>
                        {DEFAULT_ENTITY_LEGEND.markers.length} built-in entity
                        markers
                    </summary>
                    <table className="TileMatrixEditor__legend-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Tag</th>
                                <th>Label</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEFAULT_ENTITY_LEGEND.markers.map((m) => (
                                <tr key={m.code}>
                                    <td>
                                        <code>{m.code}</code>
                                    </td>
                                    <td>{m.type}</td>
                                    <td>{m.tag}</td>
                                    <td>{m.label}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </details>
            </fieldset>

            {/* --- Status --- */}
            <div
                className={`TileMatrixEditor__status ${statusType === "error" ? "TileMatrixEditor__status--error" : statusType === "ok" ? "TileMatrixEditor__status--ok" : ""}`}
            >
                {status}
            </div>
        </div>
    );
};

export default TileMatrixEditorTool;
